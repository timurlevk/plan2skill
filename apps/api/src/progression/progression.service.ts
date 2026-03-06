import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { XPSource, TaskCompletionResult } from '@plan2skill/types';
import { LootService } from '../loot/loot.service';
import { RoadmapService } from '../roadmap/roadmap.service';
import { AchievementService } from '../achievement/achievement.service';
import { CharacterService } from '../character/character.service';
import { SkillEloService } from '../skill-elo/skill-elo.service';
import { LeagueService } from '../social/league.service';
import { PartyQuestService } from '../social/party-quest.service';
import { InsightGeneratorService } from '../ai/core/insight-generator.service';
import { CacheService } from '../ai/core/cache.service';

/** Trigger insight generation every N completions */
const INSIGHT_GENERATION_INTERVAL = 5;

// ─── XP Caps by Subscription Tier (DEC-007) ─────────────────────

const XP_CAPS: Record<string, { cap: number; postCapRate: number }> = {
  free: { cap: 150, postCapRate: 0.1 },
  pro: { cap: 500, postCapRate: 0.25 },
  champion: { cap: 1000, postCapRate: 0.5 },
};

@Injectable()
export class ProgressionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => LootService))
    private readonly lootService: LootService,
    @Inject(forwardRef(() => RoadmapService))
    private readonly roadmapService: RoadmapService,
    @Inject(forwardRef(() => AchievementService))
    private readonly achievementService: AchievementService,
    @Inject(forwardRef(() => CharacterService))
    private readonly characterService: CharacterService,
    private readonly skillEloService: SkillEloService,
    @Inject(forwardRef(() => LeagueService))
    private readonly leagueService: LeagueService,
    @Inject(forwardRef(() => PartyQuestService))
    private readonly partyQuestService: PartyQuestService,
    private readonly insightGeneratorService: InsightGeneratorService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * XP needed to go from level n to level n+1.
   * Canonical formula (matches @plan2skill/store level-utils.ts):
   *   xpForLevel(n) = 80 + 20 * n
   * Cumulative: totalXp(n) = 10n² + 90n
   */
  xpForLevel(level: number): number {
    return 80 + 20 * level;
  }

  /**
   * Calculate level from total XP using quadratic inverse:
   *   level = floor((-90 + sqrt(8100 + 40 * totalXp)) / 20) + 1
   * Falls back to 1 for totalXp < 100 (xpForLevel(1) = 100).
   */
  levelFromXp(totalXp: number): number {
    if (totalXp < 100) return 1;
    // Cumulative: totalXp = 10*n² + 90*n → n = (-90 + sqrt(8100 + 40*totalXp)) / 20
    const n = (-90 + Math.sqrt(8100 + 40 * totalXp)) / 20;
    return Math.max(1, Math.floor(n) + 1);
  }

  /** Award XP to user */
  async awardXp(
    userId: string,
    amount: number,
    source: XPSource,
    multiplier: number = 1.0,
    metadata: Record<string, unknown> = {} as any,
  ) {
    const totalAmount = Math.floor(amount * multiplier);

    // Record XP event
    await this.prisma.xPEvent.create({
      data: { userId, amount: totalAmount, source, multiplier, metadata: metadata as any },
    });

    // Update progression
    const progression = await this.prisma.userProgression.update({
      where: { userId },
      data: {
        totalXp: { increment: totalAmount },
      },
    });

    // Check level up
    const newLevel = this.levelFromXp(progression.totalXp);
    if (newLevel !== progression.level) {
      await this.prisma.userProgression.update({
        where: { userId },
        data: { level: newLevel },
      });
    }

    return {
      xpEarned: totalAmount,
      totalXp: progression.totalXp,
      previousLevel: progression.level,
      currentLevel: newLevel,
      leveledUp: newLevel > progression.level,
    };
  }

  /**
   * Streak state machine (DA-01):
   *   active → at_risk (22h idle) → frozen (freeze applied) → broken (48h+ no freeze)
   *
   * Transitions on user activity:
   *   - Same day: no-op
   *   - Next day: active, streak++
   *   - 2-day gap + freeze available: frozen → active, streak preserved
   *   - 2-day gap + no freeze: broken, streak = 1
   *   - 3+ day gap: broken, streak = 1
   *
   * Uses user's timezone for day boundary calculation.
   */
  async updateStreak(
    userId: string,
    userTimezone: string = 'UTC',
  ): Promise<{ updated: boolean; currentStreak: number; status: string }> {
    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (!streak) return { updated: false, currentStreak: 0, status: 'active' };

    // Calculate today and last activity in user's timezone
    const now = new Date();
    const todayInTz = this.dateInTimezone(now, userTimezone);
    const lastInTz = this.dateInTimezone(streak.lastActivityDate, userTimezone);

    const diffDays = Math.floor(
      (todayInTz.getTime() - lastInTz.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return { updated: false, currentStreak: streak.currentStreak, status: streak.status };
    }

    if (diffDays === 1) {
      // Consecutive day — active
      const newStreak = streak.currentStreak + 1;
      await this.prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivityDate: now,
          status: 'active',
          frozenAt: null,
        },
      });

      // Phase 5F: Daily login bonus (10 coins) + streak milestone (25 coins at 7-day multiples)
      let coinBonus = 10; // daily login
      if (newStreak > 0 && newStreak % 7 === 0) {
        coinBonus += 25; // streak milestone
      }
      await this.prisma.userProgression.update({
        where: { userId },
        data: { coins: { increment: coinBonus } },
      });

      return { updated: true, currentStreak: newStreak, status: 'active' };
    }

    if (diffDays === 2) {
      // 1-day gap — try freeze
      const canFreeze = streak.freezesUsed < streak.maxFreezes;
      if (canFreeze) {
        const newStreak = streak.currentStreak + 1;
        await this.prisma.streak.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastActivityDate: now,
            freezesUsed: { increment: 1 },
            freezesUsedMonth: { increment: 1 },
            status: 'active',
            frozenAt: null,
          },
        });

        // Phase 5F: Daily login bonus (10 coins) + streak milestone (25 coins at 7-day multiples)
        let coinBonus = 10;
        if (newStreak > 0 && newStreak % 7 === 0) {
          coinBonus += 25;
        }
        await this.prisma.userProgression.update({
          where: { userId },
          data: { coins: { increment: coinBonus } },
        });

        return { updated: true, currentStreak: newStreak, status: 'active' };
      }
    }

    // Streak broken (gap >= 2 days without freeze, or gap >= 3 days)
    // UX-R141: Positive framing — "Welcome back, hero" not guilt
    await this.prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: now,
        status: 'active', // Reset to active on return
        frozenAt: null,
      },
    });
    return { updated: true, currentStreak: 1, status: 'active' };
  }

  /** Convert a Date to midnight in user's timezone, expressed as UTC */
  private dateInTimezone(date: Date, timezone: string): Date {
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone });
    const midnightLocal = new Date(`${dateStr}T00:00:00`);
    const midnightInTz = new Date(
      midnightLocal.toLocaleString('en-US', { timeZone: timezone }),
    );
    const midnightUtc = new Date(
      midnightLocal.toLocaleString('en-US', { timeZone: 'UTC' }),
    );
    const offsetMs = midnightUtc.getTime() - midnightInTz.getTime();
    return new Date(midnightLocal.getTime() + offsetMs);
  }

  /** Get full progression profile for a user */
  async getProfile(userId: string) {
    const [progression, streak, character] = await Promise.all([
      this.prisma.userProgression.findUnique({ where: { userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.character.findUnique({
        where: { userId },
        include: { equipment: true },
      }),
    ]);

    if (!progression) return null;

    const levelInfo = {
      level: progression.level,
      totalXp: progression.totalXp,
      xpForNextLevel: this.xpForLevel(progression.level),
      xpInCurrentLevel: this.xpInCurrentLevel(progression.totalXp, progression.level),
    };

    return {
      ...levelInfo,
      coins: progression.coins,
      energyCrystals: progression.energyCrystals,
      maxEnergyCrystals: progression.maxEnergyCrystals,
      subscriptionTier: progression.subscriptionTier,
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            status: streak.status,
            lastActivityDate: streak.lastActivityDate.toISOString(),
            freezesUsed: streak.freezesUsed,
            maxFreezes: streak.maxFreezes,
          }
        : null,
      character: character
        ? {
            characterId: character.characterId,
            archetypeId: character.archetypeId,
            evolutionTier: character.evolutionTier,
            attributes: {
              STR: character.strength,
              INT: character.intelligence,
              CHA: character.charisma,
              CON: character.constitution,
              DEX: character.dexterity,
              WIS: character.wisdom,
            },
            equipment: character.equipment.map((e) => ({
              slot: e.slot,
              itemId: e.itemId,
              rarity: e.rarity,
            })),
          }
        : null,
    };
  }

  /**
   * DA-07: Calculate effective XP with soft cap (diminishing returns).
   * Never zeroes out — always returns at least 1 XP.
   *
   * DEC-007 caps:
   *   Free: 150 XP/day (10% after cap)
   *   Pro: 500 XP/day (25% after cap)
   *   Champion: 1000 XP/day (50% after cap)
   */
  private async calculateEffectiveXp(userId: string, rawXp: number): Promise<number> {
    const progression = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { subscriptionTier: true },
    });
    const tier = progression?.subscriptionTier ?? 'free';
    const tierCaps = XP_CAPS[tier];
    const cap = tierCaps?.cap ?? 150;
    const postCapRate = tierCaps?.postCapRate ?? 0.1;

    // Get user timezone
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const todayStart = this.todayStartInTimezone(user?.timezone ?? 'UTC');

    // Sum today's XP
    const result = await this.prisma.xPEvent.aggregate({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    });
    const dailyXpEarned = result._sum.amount ?? 0;

    if (dailyXpEarned < cap) {
      // Under cap — full XP
      const overflow = Math.max(0, dailyXpEarned + rawXp - cap);
      if (overflow === 0) {
        return rawXp;
      }
      // Partially capped
      const fullPortion = rawXp - overflow;
      const reducedPortion = Math.max(1, Math.floor(overflow * postCapRate));
      return fullPortion + reducedPortion;
    }

    // Fully over cap — diminishing returns
    return Math.max(1, Math.floor(rawXp * postCapRate));
  }

  /**
   * Get the start of today in the user's timezone, expressed as a UTC Date.
   */
  private todayStartInTimezone(timezone: string): Date {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    const midnightLocal = new Date(`${dateStr}T00:00:00`);
    const midnightInTz = new Date(
      midnightLocal.toLocaleString('en-US', { timeZone: timezone }),
    );
    const midnightUtc = new Date(
      midnightLocal.toLocaleString('en-US', { timeZone: 'UTC' }),
    );
    const offsetMs = midnightUtc.getTime() - midnightInTz.getTime();
    return new Date(midnightLocal.getTime() + offsetMs);
  }

  /** XP already earned in current level */
  private xpInCurrentLevel(totalXp: number, level: number): number {
    // Cumulative XP to reach current level = 10*(level-1)² + 90*(level-1)
    const n = level - 1;
    const cumulativeToLevel = 10 * n * n + 90 * n;
    return totalXp - cumulativeToLevel;
  }

  /**
   * Complete a task — XP + coins + streak + level check + quest completion record (DA-02).
   * Validates ownership, energy, idempotency, and optional time-gating (DA-05).
   */
  async completeTask(
    userId: string,
    taskId: string,
    validationResult: Record<string, unknown> = {},
    timeSpentSeconds?: number,
  ): Promise<TaskCompletionResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { milestone: { include: { roadmap: true, tasks: true } } },
    });

    if (!task || task.milestone.roadmap.userId !== userId) {
      throw new Error('Task not found or unauthorized');
    }

    if (task.status === 'completed') {
      throw new Error('Quest already completed');
    }

    // Time-gating check (DA-05): enforce minimum time if set
    if (task.requiredTimeSpent && timeSpentSeconds != null) {
      if (timeSpentSeconds < task.requiredTimeSpent) {
        throw new Error('Minimum quest time not met');
      }
    }

    // Check energy crystals
    const progression = await this.prisma.userProgression.findUnique({ where: { userId } });
    if (!progression || progression.energyCrystals <= 0) {
      throw new Error('No energy crystals available');
    }

    // Get user timezone for streak calculation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone ?? 'UTC';

    // Mark task completed
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'completed', completedAt: new Date() },
    });

    // Unlock next task in milestone
    const nextTask = await this.prisma.task.findFirst({
      where: {
        milestoneId: task.milestoneId,
        status: 'locked',
        order: { gt: task.order },
      },
      orderBy: { order: 'asc' },
    });
    if (nextTask) {
      await this.prisma.task.update({
        where: { id: nextTask.id },
        data: { status: 'available' },
      });
    }

    // Consume energy crystal
    await this.prisma.userProgression.update({
      where: { userId },
      data: { energyCrystals: { decrement: 1 } },
    });

    // Award XP (with soft cap enforcement — DEC-007)
    const effectiveXp = await this.calculateEffectiveXp(userId, task.xpReward);
    const xpResult = await this.awardXp(userId, effectiveXp, 'task_complete');

    // Award coins
    await this.prisma.userProgression.update({
      where: { userId },
      data: { coins: { increment: task.coinReward } },
    });

    // Roll loot drop (Phase 5F — DEC-5F-01: guaranteed 100% drop)
    let lootDrop: { itemId: string; slot: string; rarity: string; name: string; description: string; attributeBonus: Record<string, number> } | null = null;
    try {
      lootDrop = await this.lootService.rollLoot(userId, task.rarity ?? 'common', task.skillDomain ?? null);
    } catch {
      // Non-blocking — loot failure should not block quest completion
    }

    // Record quest completion (DA-02)
    await this.prisma.questCompletion.create({
      data: {
        userId,
        taskId,
        questType: task.questType,
        rarity: task.rarity,
        baseXp: task.xpReward,
        bonusXp: 0,
        qualityScore: (validationResult as Record<string, unknown>)?.qualityScore as number ?? null,
        validationResult: validationResult as any,
        timeSpentSeconds: timeSpentSeconds ?? null,
      },
    });

    // Update skill Elo (Phase J — adaptive difficulty)
    if (task.skillDomain) {
      const qualityScore = (validationResult as any)?.qualityScore ?? 0.5;
      this.skillEloService
        .updateAfterQuest(userId, task.skillDomain, qualityScore, task.difficultyTier ?? 3)
        .catch(() => { /* non-blocking */ });
    }

    // Update streak with timezone
    const streakResult = await this.updateStreak(userId, timezone);

    // League XP (non-blocking)
    this.leagueService.addWeeklyXp(userId, xpResult.xpEarned).catch(() => {});

    // Party Quest damage (non-blocking)
    this.partyQuestService.dealDamage(userId, xpResult.xpEarned).catch(() => {});

    // Fresh query for milestone completion check (avoids stale snapshot)
    const freshMilestone = await this.prisma.milestone.findUnique({
      where: { id: task.milestoneId },
      include: { tasks: { select: { id: true, status: true } } },
    });
    const completedTasks = freshMilestone!.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = freshMilestone!.tasks.length;
    const milestoneCompleted = completedTasks >= totalTasks;

    // Phase 5H: Attribute growth on milestone completion
    let attributeGrowthResult: { attribute: string; amount: number }[] | null = null;
    let evolutionTierChange: string | null = null;

    if (milestoneCompleted) {
      await this.prisma.milestone.update({
        where: { id: task.milestoneId },
        data: { status: 'completed', progress: 100 },
      });

      // Activate next milestone in sequence
      const nextMilestone = await this.prisma.milestone.findFirst({
        where: {
          roadmapId: task.milestone.roadmapId,
          status: 'locked',
          order: { gt: task.milestone.order },
        },
        orderBy: { order: 'asc' },
      });
      if (nextMilestone) {
        await this.prisma.milestone.update({
          where: { id: nextMilestone.id },
          data: { status: 'active' },
        });
        // Unlock first task of new milestone
        const firstTask = await this.prisma.task.findFirst({
          where: { milestoneId: nextMilestone.id, status: 'locked' },
          orderBy: { order: 'asc' },
        });
        if (firstTask) {
          await this.prisma.task.update({
            where: { id: firstTask.id },
            data: { status: 'available' },
          });
        }
      }

      await this.awardXp(userId, 100, 'milestone_complete');

      // Find dominant skill domain from milestone tasks
      const domainCounts = new Map<string, number>();
      for (const t of task.milestone.tasks) {
        if (t.skillDomain) domainCounts.set(t.skillDomain, (domainCounts.get(t.skillDomain) ?? 0) + 1);
      }
      let dominantDomain: string | null = null;
      let maxCount = 0;
      for (const [domain, count] of domainCounts) {
        if (count > maxCount) { dominantDomain = domain; maxCount = count; }
      }

      // Lookup mapping from ref_skill_domain_attributes (DB, not hardcoded)
      if (dominantDomain) {
        try {
          const mapping = await this.prisma.skillDomainAttribute.findFirst({
            where: { skillDomain: dominantDomain, validTo: null },
          });
          if (mapping) {
            const effectivePrimary = await this.characterService.addAttribute(userId, mapping.primaryAttr, mapping.primaryGrowth);
            const effectiveSecondary = await this.characterService.addAttribute(userId, mapping.secondaryAttr, mapping.secondaryGrowth);
            evolutionTierChange = await this.characterService.checkEvolution(userId);
            attributeGrowthResult = [
              { attribute: mapping.primaryAttr, amount: effectivePrimary },
              { attribute: mapping.secondaryAttr, amount: effectiveSecondary },
            ];
          }
        } catch {
          // Non-blocking — attribute growth failure should not block task completion
        }
      }
    } else {
      await this.prisma.milestone.update({
        where: { id: task.milestoneId },
        data: { progress: (completedTasks / totalTasks) * 100 },
      });
    }

    // Update roadmap progress
    const allMilestones = await this.prisma.milestone.findMany({
      where: { roadmapId: task.milestone.roadmapId },
      include: { tasks: true },
    });
    const totalRoadmapTasks = allMilestones.reduce((sum, m) => sum + m.tasks.length, 0);
    const completedRoadmapTasks = allMilestones.reduce(
      (sum, m) => sum + m.tasks.filter((t) => t.status === 'completed').length,
      0,
    );
    const roadmapProgress = totalRoadmapTasks > 0
      ? (completedRoadmapTasks / totalRoadmapTasks) * 100
      : 0;

    await this.prisma.roadmap.update({
      where: { id: task.milestone.roadmapId },
      data: { progress: roadmapProgress },
    });

    // BL-007: Auto-complete roadmap when progress reaches 100%
    let roadmapCompleted = false;
    if (roadmapProgress >= 100) {
      roadmapCompleted = true;
      try {
        await this.roadmapService.completeRoadmap(userId, task.milestone.roadmapId);
        await this.awardXp(userId, 200, 'roadmap_complete');
        await this.achievementService.unlockAchievement(userId, 'roadmap_complete', 200);
      } catch {
        // Non-blocking — roadmap completion failure should not block task completion
      }
    }

    // Auto-seed spaced repetition review item (Phase 5D)
    if (task.skillDomain) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.prisma.reviewItem.upsert({
        where: { userId_skillId: { userId, skillId: `${task.skillDomain}:${task.id}` } },
        create: {
          userId,
          skillId: `${task.skillDomain}:${task.id}`,
          skillDomain: task.skillDomain,
          nextReview: tomorrow,
        },
        update: {},
      });
    }

    // Cache invalidation after quest completion (non-blocking)
    this.cacheService.invalidateForEvent(userId, 'quest_complete').catch(() => {});

    // L4: Trigger insight generation every N completions (non-blocking)
    this.prisma.questCompletion
      .count({ where: { userId } })
      .then((count) => {
        if (count > 0 && count % INSIGHT_GENERATION_INTERVAL === 0) {
          this.insightGeneratorService.generateInsights(userId).catch(() => {});
        }
      })
      .catch(() => {});

    return {
      xpEarned: xpResult.xpEarned,
      coinsEarned: task.coinReward,
      totalXp: xpResult.totalXp,
      previousLevel: xpResult.previousLevel,
      currentLevel: xpResult.currentLevel,
      leveledUp: xpResult.leveledUp,
      streakUpdated: streakResult.updated,
      currentStreak: streakResult.currentStreak,
      milestoneCompleted,
      milestoneId: task.milestoneId,
      roadmapProgress,
      roadmapCompleted,
      lootDrop,
      attributeGrowth: attributeGrowthResult,
      evolutionTierChange,
    };
  }

  /** Recharge energy crystals (called daily by cron or on login) */
  async rechargeEnergy(userId: string) {
    const progression = await this.prisma.userProgression.findUnique({ where: { userId } });
    if (!progression) return;

    if (progression.energyCrystals < progression.maxEnergyCrystals) {
      await this.prisma.userProgression.update({
        where: { userId },
        data: {
          energyCrystals: progression.maxEnergyCrystals,
          energyRechargeAt: null,
        },
      });
    }
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { XPSource, TaskCompletionResult } from '@plan2skill/types';

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Convert a Date to midnight in user's timezone (for day boundary) */
  private dateInTimezone(date: Date, timezone: string): Date {
    const str = date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
    return new Date(str + 'T00:00:00Z');
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
              mastery: character.mastery,
              insight: character.insight,
              influence: character.influence,
              resilience: character.resilience,
              versatility: character.versatility,
              discovery: character.discovery,
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

    // Consume energy crystal
    await this.prisma.userProgression.update({
      where: { userId },
      data: { energyCrystals: { decrement: 1 } },
    });

    // Award XP
    const xpResult = await this.awardXp(userId, task.xpReward, 'task_complete');

    // Award coins
    await this.prisma.userProgression.update({
      where: { userId },
      data: { coins: { increment: task.coinReward } },
    });

    // Record quest completion (DA-02)
    await this.prisma.questCompletion.create({
      data: {
        userId,
        taskId,
        questType: task.questType,
        rarity: task.rarity,
        baseXp: task.xpReward,
        bonusXp: 0,
        validationResult: validationResult as any,
        timeSpentSeconds: timeSpentSeconds ?? null,
      },
    });

    // Update streak with timezone
    const streakResult = await this.updateStreak(userId, timezone);

    // Check milestone completion
    const completedTasks = task.milestone.tasks.filter(
      (t) => t.status === 'completed' || t.id === taskId,
    ).length;
    const totalTasks = task.milestone.tasks.length;
    const milestoneCompleted = completedTasks >= totalTasks;

    if (milestoneCompleted) {
      await this.prisma.milestone.update({
        where: { id: task.milestoneId },
        data: { status: 'completed', progress: 100 },
      });
      await this.awardXp(userId, 100, 'milestone_complete');
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
    ) + 1;
    const roadmapProgress = totalRoadmapTasks > 0
      ? (completedRoadmapTasks / totalRoadmapTasks) * 100
      : 0;

    await this.prisma.roadmap.update({
      where: { id: task.milestone.roadmapId },
      data: { progress: roadmapProgress },
    });

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
      roadmapProgress,
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

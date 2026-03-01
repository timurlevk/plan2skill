import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Quest Engine v2 (Phase 5C)
 *
 * Responsibilities:
 * - DA-06: Daily quest allocation with type diversity enforcement
 * - DA-07: XP cap enforcement (soft cap with diminishing returns)
 * - Quest validation dispatch (knowledge check, effort reflection, etc.)
 */

// ─── XP Caps by Subscription Tier (DEC-007) ─────────────────────

const XP_CAPS: Record<string, { cap: number; postCapRate: number }> = {
  free: { cap: 150, postCapRate: 0.1 },
  pro: { cap: 500, postCapRate: 0.25 },
  champion: { cap: 1000, postCapRate: 0.5 },
};

// ─── Quest Type Diversity (max 2 of same type per day) ──────────

const MAX_SAME_TYPE_PER_DAY = 2;
const DAILY_QUEST_COUNT = 5;

@Injectable()
export class QuestService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * DA-06: Get today's quests for a user with diversity enforcement.
   * Rules:
   * - Max 5 quests per day
   * - Max 2 of the same quest type
   * - Prefer unlocked tasks from active milestone
   * - Difficulty calibration: match user's avg quality score
   */
  async getDailyQuests(userId: string) {
    // Get user's active roadmaps
    const roadmaps = await this.prisma.roadmap.findMany({
      where: { userId, status: 'active' },
      include: {
        milestones: {
          where: { status: { in: ['active', 'in_progress'] } },
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { status: { in: ['available', 'locked'] } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    // Flatten available tasks across roadmaps
    const candidateTasks = roadmaps.flatMap((r) =>
      r.milestones.flatMap((m) => m.tasks),
    );

    if (candidateTasks.length === 0) return [];

    // Check what types already completed today
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone ?? 'UTC';
    const todayStart = this.todayStartInTimezone(timezone);

    const todayCompletions = await this.prisma.questCompletion.findMany({
      where: {
        userId,
        completedAt: { gte: todayStart },
      },
      select: { questType: true, taskId: true },
    });

    const completedTaskIds = new Set(todayCompletions.map((c) => c.taskId));
    const typeCountToday = new Map<string, number>();
    for (const c of todayCompletions) {
      typeCountToday.set(c.questType, (typeCountToday.get(c.questType) ?? 0) + 1);
    }

    // Select quests with diversity enforcement
    const selected: typeof candidateTasks = [];
    const selectionTypeCounts = new Map<string, number>();

    for (const task of candidateTasks) {
      if (selected.length >= DAILY_QUEST_COUNT) break;
      if (completedTaskIds.has(task.id)) continue;

      const existingCount =
        (typeCountToday.get(task.questType) ?? 0) +
        (selectionTypeCounts.get(task.questType) ?? 0);

      if (existingCount >= MAX_SAME_TYPE_PER_DAY) continue;

      selected.push(task);
      selectionTypeCounts.set(
        task.questType,
        (selectionTypeCounts.get(task.questType) ?? 0) + 1,
      );
    }

    // If we don't have enough diverse quests, fill remaining slots ignoring type constraint
    if (selected.length < DAILY_QUEST_COUNT) {
      for (const task of candidateTasks) {
        if (selected.length >= DAILY_QUEST_COUNT) break;
        if (completedTaskIds.has(task.id)) continue;
        if (selected.some((s) => s.id === task.id)) continue;
        selected.push(task);
      }
    }

    return selected.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      questType: task.questType,
      estimatedMinutes: task.estimatedMinutes,
      xpReward: task.xpReward,
      coinReward: task.coinReward,
      rarity: task.rarity,
      difficultyTier: task.difficultyTier,
      validationType: task.validationType,
      knowledgeCheck: task.knowledgeCheck,
      skillDomain: task.skillDomain,
    }));
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
  async calculateEffectiveXp(
    userId: string,
    rawXp: number,
  ): Promise<{ effectiveXp: number; dailyXpEarned: number; capped: boolean }> {
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
        return { effectiveXp: rawXp, dailyXpEarned, capped: false };
      }
      // Partially capped
      const fullPortion = rawXp - overflow;
      const reducedPortion = Math.max(1, Math.floor(overflow * postCapRate));
      return {
        effectiveXp: fullPortion + reducedPortion,
        dailyXpEarned,
        capped: true,
      };
    }

    // Fully over cap — diminishing returns
    const effectiveXp = Math.max(1, Math.floor(rawXp * postCapRate));
    return { effectiveXp, dailyXpEarned, capped: true };
  }

  /**
   * Validate a quest completion based on validation type.
   * Returns quality score (0.0-1.0) for engagement depth.
   */
  validateCompletion(
    validationType: string,
    validationData: Record<string, unknown>,
    knowledgeCheck: unknown,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    switch (validationType) {
      case 'knowledge_quiz':
        return this.validateKnowledgeQuiz(validationData, knowledgeCheck);
      case 'effort_reflection':
        return this.validateEffortReflection(validationData);
      case 'completion_attestation':
        return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };
      case 'journal_entry':
        return this.validateJournalEntry(validationData);
      default:
        return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };
    }
  }

  private validateKnowledgeQuiz(
    data: Record<string, unknown>,
    knowledgeCheck: unknown,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    const check = knowledgeCheck as {
      correctIndex: number;
      explanation?: string;
    } | null;
    if (!check) return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };

    const selectedIndex = data.selectedIndex as number | undefined;
    const correct = selectedIndex === check.correctIndex;

    return {
      valid: true, // Even wrong answers count — learning from mistakes
      qualityScore: correct ? 1.0 : 0.3,
      feedback: correct
        ? 'Knowledge mastered!'
        : check.explanation ?? 'Keep studying, hero!',
    };
  }

  private validateEffortReflection(
    data: Record<string, unknown>,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    const rpe = data.rpe as number | undefined; // Rate of Perceived Exertion (1-10)
    if (rpe == null) return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };

    // Higher effort = higher quality score
    const qualityScore = Math.min(1.0, rpe / 10);
    return {
      valid: true,
      qualityScore,
      feedback: rpe >= 7 ? 'Heroic effort!' : 'Well done, hero!',
    };
  }

  private validateJournalEntry(
    data: Record<string, unknown>,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    const text = data.text as string | undefined;
    if (!text || text.trim().length < 10) {
      return { valid: false, qualityScore: 0, feedback: 'Write at least a few sentences, hero.' };
    }

    // Quality based on reflection depth (word count as proxy)
    const wordCount = text.trim().split(/\s+/).length;
    const qualityScore = Math.min(1.0, wordCount / 50);
    return {
      valid: true,
      qualityScore,
      feedback: wordCount >= 30 ? 'Deep reflection!' : 'Quest Complete!',
    };
  }

  private todayStartInTimezone(timezone: string): Date {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    return new Date(dateStr + 'T00:00:00Z');
  }
}

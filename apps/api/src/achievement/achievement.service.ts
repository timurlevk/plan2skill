import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Achievement System — Server-side Rules Engine (Phase 5E)
 *
 * Responsibilities:
 * - Persist achievement unlocks to DB
 * - Track which achievements a user has earned
 * - Award XP for achievement unlocks
 * - Generate weekly challenges
 *
 * Note: Achievement checking logic lives client-side (achievements.ts).
 * This service handles persistence and weekly challenges.
 */

interface WeeklyChallengeTemplate {
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetValue: number;
  targetDomain?: string;
  xpReward: number;
  coinReward: number;
}

@Injectable()
export class AchievementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Achievement Persistence ───────────────────────────────────

  /** Get all unlocked achievement IDs for a user */
  async getUnlockedAchievements(userId: string) {
    const unlocks = await this.prisma.achievementUnlock.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
    return unlocks.map((u) => ({
      achievementId: u.achievementId,
      xpAwarded: u.xpAwarded,
      unlockedAt: u.unlockedAt.toISOString(),
    }));
  }

  /** Persist a newly unlocked achievement (idempotent) */
  async unlockAchievement(userId: string, achievementId: string, xpReward: number) {
    // Upsert — idempotent, won't duplicate
    const unlock = await this.prisma.achievementUnlock.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      create: { userId, achievementId, xpAwarded: xpReward },
      update: {},
    });

    // Award XP if newly created (check if xpAwarded was 0 before)
    if (xpReward > 0) {
      // Check if XP was already awarded (avoid double-award on re-sync)
      const existing = await this.prisma.xPEvent.findFirst({
        where: { userId, source: 'achievement', metadata: { path: ['achievementId'], equals: achievementId } },
      });

      if (!existing) {
        await this.prisma.xPEvent.create({
          data: {
            userId,
            amount: xpReward,
            source: 'achievement',
            metadata: { achievementId } as any,
          },
        });
        await this.prisma.userProgression.update({
          where: { userId },
          data: { totalXp: { increment: xpReward } },
        });
      }
    }

    return {
      achievementId: unlock.achievementId,
      xpAwarded: unlock.xpAwarded,
      unlockedAt: unlock.unlockedAt.toISOString(),
    };
  }

  /** Batch sync unlocked achievements from client (called on login/hydration) */
  async syncAchievements(userId: string, achievementIds: string[]) {
    const existing = await this.prisma.achievementUnlock.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const existingIds = new Set(existing.map((e) => e.achievementId));
    const newIds = achievementIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await this.prisma.achievementUnlock.createMany({
        data: newIds.map((achievementId) => ({ userId, achievementId })),
        skipDuplicates: true,
      });
    }

    return { synced: newIds.length, total: existingIds.size + newIds.length };
  }

  // ─── Weekly Challenges ─────────────────────────────────────────

  /** Get or generate this week's challenges for a user */
  async getWeeklyChallenges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone ?? 'UTC';
    const weekStart = this.getWeekStart(timezone);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    // Check if challenges already exist for this week
    let challenges = await this.prisma.weeklyChallenge.findMany({
      where: { userId, weekStart },
      orderBy: { difficulty: 'asc' },
    });

    // Generate if missing
    if (challenges.length === 0) {
      const templates = await this.generateChallengeTemplates(userId);
      await this.prisma.weeklyChallenge.createMany({
        data: templates.map((t) => ({
          userId,
          weekStart,
          type: t.type,
          difficulty: t.difficulty,
          targetValue: t.targetValue,
          targetDomain: t.targetDomain ?? null,
          xpReward: t.xpReward,
          coinReward: t.coinReward,
        })),
      });
      challenges = await this.prisma.weeklyChallenge.findMany({
        where: { userId, weekStart },
        orderBy: { difficulty: 'asc' },
      });
    }

    const allCompleted = challenges.every((c) => c.completed);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      challenges: challenges.map((c) => ({
        id: c.id,
        type: c.type,
        difficulty: c.difficulty,
        title: this.challengeTitle(c.type, c.targetValue, c.targetDomain ?? undefined),
        targetValue: c.targetValue,
        currentValue: c.currentValue,
        progress: c.targetValue > 0 ? Math.min(1, c.currentValue / c.targetValue) : 0,
        completed: c.completed,
        xpReward: c.xpReward,
        coinReward: c.coinReward,
      })),
      allCompleted,
    };
  }

  /** Increment challenge progress (called as side effect from completeTask/submitReview) */
  async incrementChallengeProgress(
    userId: string,
    type: string,
    amount: number = 1,
    domain?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const weekStart = this.getWeekStart(user?.timezone ?? 'UTC');

    const challenges = await this.prisma.weeklyChallenge.findMany({
      where: {
        userId,
        weekStart,
        type,
        completed: false,
        ...(domain ? { targetDomain: domain } : {}),
      },
    });

    for (const challenge of challenges) {
      const newValue = challenge.currentValue + amount;
      const completed = newValue >= challenge.targetValue;

      await this.prisma.weeklyChallenge.update({
        where: { id: challenge.id },
        data: {
          currentValue: newValue,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      // Award challenge reward on completion
      if (completed) {
        await this.prisma.xPEvent.create({
          data: {
            userId,
            amount: challenge.xpReward,
            source: 'weekly_challenge',
            metadata: { challengeId: challenge.id } as any,
          },
        });
        await this.prisma.userProgression.update({
          where: { userId },
          data: {
            totalXp: { increment: challenge.xpReward },
            coins: { increment: challenge.coinReward },
          },
        });
      }
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────

  private async generateChallengeTemplates(userId: string): Promise<WeeklyChallengeTemplate[]> {
    // Get user stats for calibration
    const completionCount = await this.prisma.questCompletion.count({ where: { userId } });
    const avgDaily = Math.max(1, Math.round(completionCount / 14)); // rough avg over 2 weeks

    return [
      // Easy: quest volume (slightly above avg)
      {
        type: 'quest_volume',
        difficulty: 'easy' as const,
        targetValue: Math.max(5, avgDaily * 5),
        xpReward: 50,
        coinReward: 15,
      },
      // Medium: review sprint
      {
        type: 'review_sprint',
        difficulty: 'medium' as const,
        targetValue: 10,
        xpReward: 100,
        coinReward: 30,
      },
      // Hard: XP target
      {
        type: 'xp_target',
        difficulty: 'hard' as const,
        targetValue: Math.max(300, avgDaily * 10 * 25),
        xpReward: 200,
        coinReward: 50,
      },
    ];
  }

  private challengeTitle(type: string, target: number, domain?: string): string {
    switch (type) {
      case 'quest_volume': return `Complete ${target} quests`;
      case 'streak_guard': return `Maintain your streak all week`;
      case 'domain_focus': return `Complete ${target} ${domain ?? ''} quests`.trim();
      case 'review_sprint': return `Review ${target} skills`;
      case 'xp_target': return `Earn ${target} XP`;
      case 'perfect_day': return `Have ${target} Perfect Days`;
      case 'mastery_push': return `Level up ${target} skill${target > 1 ? 's' : ''}`;
      default: return `Complete ${target} tasks`;
    }
  }

  private getWeekStart(timezone: string): Date {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    const todayInTz = new Date(dateStr + 'T00:00:00Z');
    const day = todayInTz.getUTCDay(); // 0=Sun, 1=Mon
    const diff = day === 0 ? 6 : day - 1; // Days since Monday
    return new Date(todayInTz.getTime() - diff * 86400000);
  }
}

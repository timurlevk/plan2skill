import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Spaced Repetition Engine — SM-2 Modified for Gamification (Phase 5D)
 *
 * EFA §6.1: SM-2 algorithm with mastery levels.
 * Anti-cramming: mastery requires spaced practice (growing intervals + EF).
 */

const MASTERY_LABELS = ['New', 'Attempted', 'Familiar', 'Proficient', 'Advanced', 'Mastered'] as const;

@Injectable()
export class SpacedRepetitionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── SM-2 Algorithm Core ───────────────────────────────────────

  /**
   * SM-2 core update. Returns new state for a review item.
   * EFA §6.1: On correct (quality ≥ 3), extend interval. On incorrect, reset.
   */
  private sm2Update(
    quality: number,
    ef: number,
    interval: number,
    reps: number,
  ): { ef: number; interval: number; reps: number } {
    if (quality >= 3) {
      let newInterval: number;
      if (reps === 0) newInterval = 1;
      else if (reps === 1) newInterval = 6;
      else newInterval = Math.round(interval * ef);

      const newEf = Math.max(
        1.3,
        ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
      );

      return { ef: newEf, interval: newInterval, reps: reps + 1 };
    }

    // Incorrect — reset repetition, keep EF (no punishment on difficulty)
    return { ef, interval: 1, reps: 0 };
  }

  /**
   * Compute mastery level (0–5) from SM-2 state.
   * Anti-cramming: requires growing intervals, not just review count.
   */
  computeMasteryLevel(reps: number, ef: number, interval: number): number {
    if (reps === 0) return 0;
    if (reps === 1) return 1;
    if (reps >= 7 && interval >= 60 && ef >= 2.2) return 5;
    if (reps >= 5 && interval >= 30 && ef >= 2.0) return 4;
    if (reps >= 3 && interval >= 14 && ef >= 1.8) return 3;
    if (reps >= 2 && interval >= 6) return 2;
    return Math.min(reps, 2);
  }

  /**
   * Calculate XP reward for a review.
   * EFA §6.2: harder items (lower EF) = more XP. Overdue = catch-up bonus.
   */
  calculateReviewXp(ef: number, daysOverdue: number): number {
    const baseXp = 25;
    const difficultyMultiplier = Math.max(1, 3 - ef);
    const overdueBonus = Math.min(2, daysOverdue * 0.1);
    return Math.round(baseXp * difficultyMultiplier * (1 + overdueBonus));
  }

  // ─── Public API ────────────────────────────────────────────────

  /** Get items due for review (nextReview ≤ now) */
  async getDueReviews(userId: string, limit: number = 10) {
    const now = new Date();

    const items = await this.prisma.reviewItem.findMany({
      where: { userId, nextReview: { lte: now } },
      orderBy: { nextReview: 'asc' },
      take: limit,
    });

    const totalDue = await this.prisma.reviewItem.count({
      where: { userId, nextReview: { lte: now } },
    });

    let nextReviewAt: string | null = null;
    if (totalDue === 0) {
      const next = await this.prisma.reviewItem.findFirst({
        where: { userId },
        orderBy: { nextReview: 'asc' },
        select: { nextReview: true },
      });
      nextReviewAt = next?.nextReview?.toISOString() ?? null;
    }

    return {
      items: items.map((item) => {
        const daysOverdue = Math.max(
          0,
          Math.floor((now.getTime() - item.nextReview.getTime()) / 86400000),
        );
        return {
          id: item.id,
          skillId: item.skillId,
          skillDomain: item.skillDomain ?? 'general',
          masteryLevel: item.masteryLevel,
          easinessFactor: item.easinessFactor,
          intervalDays: item.intervalDays,
          daysOverdue,
          reviewXp: this.calculateReviewXp(item.easinessFactor, daysOverdue),
          lastQuality: item.lastQuality,
        };
      }),
      totalDue,
      nextReviewAt,
    };
  }

  /** Submit a review score (quality 0–5) and update SM-2 state */
  async submitReview(userId: string, skillId: string, quality: number) {
    const item = await this.prisma.reviewItem.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });
    if (!item) throw new Error('Review item not found');

    const now = new Date();
    const daysOverdue = Math.max(
      0,
      Math.floor((now.getTime() - item.nextReview.getTime()) / 86400000),
    );

    // 1. Run SM-2
    const { ef, interval, reps } = this.sm2Update(
      quality,
      item.easinessFactor,
      item.intervalDays,
      item.repetitionCount,
    );

    // 2. Compute new mastery level
    const previousMasteryLevel = item.masteryLevel;
    const newMasteryLevel = this.computeMasteryLevel(reps, ef, interval);

    // 3. Next review date
    const nextReview = new Date(now.getTime() + interval * 86400000);

    // 4. Calculate XP
    const xpEarned = quality >= 3 ? this.calculateReviewXp(item.easinessFactor, daysOverdue) : 0;

    // 5. Update review item
    await this.prisma.reviewItem.update({
      where: { id: item.id },
      data: {
        easinessFactor: ef,
        intervalDays: interval,
        repetitionCount: reps,
        masteryLevel: newMasteryLevel,
        nextReview,
        lastReviewedAt: now,
        lastQuality: quality,
      },
    });

    // 6. Grant XP if correct
    if (xpEarned > 0) {
      await this.prisma.xPEvent.create({
        data: { userId, amount: xpEarned, source: 'review', metadata: { skillId } as any },
      });
      await this.prisma.userProgression.update({
        where: { userId },
        data: { totalXp: { increment: xpEarned } },
      });
    }

    return {
      skillId,
      newMasteryLevel,
      previousMasteryLevel,
      masteryUp: newMasteryLevel > previousMasteryLevel,
      masteryLabel: MASTERY_LABELS[newMasteryLevel] ?? 'New',
      newEasinessFactor: ef,
      newIntervalDays: interval,
      nextReview: nextReview.toISOString(),
      xpEarned,
      correct: quality >= 3,
    };
  }

  /** Get per-skill mastery summary for MasteryRing display */
  async getSkillMastery(userId: string) {
    const now = new Date();
    const items = await this.prisma.reviewItem.findMany({
      where: { userId },
      orderBy: [{ skillDomain: 'asc' }, { masteryLevel: 'desc' }],
    });

    const skills = items.map((item) => ({
      skillId: item.skillId,
      skillDomain: item.skillDomain ?? 'general',
      masteryLevel: item.masteryLevel,
      masteryLabel: MASTERY_LABELS[item.masteryLevel] ?? 'New',
      nextReviewDate: item.nextReview.toISOString(),
      isOverdue: item.nextReview <= now,
      totalReviews: item.repetitionCount,
    }));

    const totalSkills = skills.length;
    const masteredCount = skills.filter((s) => s.masteryLevel === 5).length;
    const dueCount = skills.filter((s) => s.isOverdue).length;
    const overallMastery =
      totalSkills > 0
        ? skills.reduce((sum, s) => sum + s.masteryLevel, 0) / (totalSkills * 5)
        : 0;

    return { skills, overallMastery, totalSkills, masteredCount, dueCount };
  }

  /** Create or get a review item for a skill (upsert — idempotent) */
  async createReviewItem(userId: string, skillId: string, skillDomain?: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const item = await this.prisma.reviewItem.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: {
        userId,
        skillId,
        skillDomain: skillDomain ?? null,
        nextReview: tomorrow,
      },
      update: {},
    });

    return {
      id: item.id,
      skillId: item.skillId,
      masteryLevel: item.masteryLevel,
      nextReview: item.nextReview.toISOString(),
    };
  }
}

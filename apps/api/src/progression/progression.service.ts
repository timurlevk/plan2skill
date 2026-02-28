import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { XPSource, TaskCompletionResult } from '@plan2skill/types';

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  /** XP needed for a given level (logarithmic curve) */
  xpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /** Calculate level from total XP */
  levelFromXp(totalXp: number): number {
    let level = 1;
    while (this.xpForLevel(level + 1) <= totalXp) {
      level++;
    }
    return level;
  }

  /** Award XP to user */
  async awardXp(
    userId: string,
    amount: number,
    source: XPSource,
    multiplier: number = 1.0,
    metadata: Record<string, unknown> = {},
  ) {
    const totalAmount = Math.floor(amount * multiplier);

    // Record XP event
    await this.prisma.xPEvent.create({
      data: { userId, amount: totalAmount, source, multiplier, metadata },
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

  /** Update streak on daily activity */
  async updateStreak(userId: string): Promise<{ updated: boolean; currentStreak: number }> {
    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (!streak) return { updated: false, currentStreak: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      // Already counted today
      return { updated: false, currentStreak: streak.currentStreak };
    }

    if (diffDays === 1) {
      // Consecutive day
      const newStreak = streak.currentStreak + 1;
      const newLongest = Math.max(newStreak, streak.longestStreak);
      await this.prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDate: new Date(),
        },
      });
      return { updated: true, currentStreak: newStreak };
    }

    // Streak broken (unless freeze available)
    if (diffDays === 2 && streak.freezesUsed < streak.maxFreezes) {
      // Use freeze
      const newStreak = streak.currentStreak + 1;
      await this.prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivityDate: new Date(),
          freezesUsed: { increment: 1 },
        },
      });
      return { updated: true, currentStreak: newStreak };
    }

    // Streak fully broken
    await this.prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: new Date(),
      },
    });
    return { updated: true, currentStreak: 1 };
  }

  /** Complete a task — XP + coins + streak + level check */
  async completeTask(userId: string, taskId: string): Promise<TaskCompletionResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { milestone: { include: { roadmap: true, tasks: true } } },
    });

    if (!task || task.milestone.roadmap.userId !== userId) {
      throw new Error('Task not found or unauthorized');
    }

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

    // Update streak
    const streakResult = await this.updateStreak(userId);

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
      // Bonus XP for milestone
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
    ) + 1; // +1 for current task
    const roadmapProgress = totalRoadmapTasks > 0 ? (completedRoadmapTasks / totalRoadmapTasks) * 100 : 0;

    await this.prisma.roadmap.update({
      where: { id: task.milestone.roadmapId },
      data: { progress: roadmapProgress },
    });

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

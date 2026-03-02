import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import type { GenerateRoadmapInput } from '@plan2skill/types';

@Injectable()
export class RoadmapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async listRoadmaps(userId: string) {
    return this.prisma.roadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  async getRoadmap(userId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    return roadmap;
  }

  async generateRoadmap(userId: string, input: GenerateRoadmapInput) {
    // Create roadmap in "generating" status
    const roadmap = await this.prisma.roadmap.create({
      data: {
        userId,
        title: `${input.goal} Roadmap`,
        goal: input.goal,
        description: '',
        durationDays: 90,
        dailyMinutes: input.dailyMinutes,
        status: 'generating',
        aiModel: 'claude-sonnet-4-6',
      },
    });

    // Generate with AI (async — The Forge will poll or use SSE)
    this.generateWithAi(roadmap.id, userId, input).catch((err) => {
      console.error('AI generation failed:', err);
      this.prisma.roadmap
        .update({
          where: { id: roadmap.id },
          data: { status: 'active' }, // Fallback
        })
        .catch(() => {});
    });

    return { roadmapId: roadmap.id, status: 'generating' };
  }

  private async generateWithAi(
    roadmapId: string,
    userId: string,
    input: GenerateRoadmapInput,
  ) {
    const aiResult = await this.ai.generateRoadmap(input);

    // Create milestones and tasks from AI result
    for (let i = 0; i < aiResult.milestones.length; i++) {
      const ms = aiResult.milestones[i]!;
      const milestone = await this.prisma.milestone.create({
        data: {
          roadmapId,
          title: ms.title,
          description: ms.description,
          weekStart: ms.weekStart,
          weekEnd: ms.weekEnd,
          order: i,
          status: i === 0 ? 'active' : 'locked',
        },
      });

      for (let j = 0; j < ms.tasks.length; j++) {
        const task = ms.tasks[j]!;
        await this.prisma.task.create({
          data: {
            milestoneId: milestone.id,
            title: task.title,
            description: task.description,
            taskType: task.taskType,
            estimatedMinutes: task.estimatedMinutes,
            xpReward: task.xpReward,
            coinReward: task.coinReward,
            rarity: task.rarity,
            status: i === 0 && j === 0 ? 'available' : 'locked',
            order: j,
          },
        });
      }
    }

    // Update roadmap
    await this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: {
        title: aiResult.title,
        description: aiResult.description,
        status: 'active',
      },
    });
  }

  // ─── BL-007: Roadmap Completion ──────────────────────────────

  async completeRoadmap(userId: string, roadmapId: string) {
    await this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'completed', progress: 100 },
    });

    // Activate next locked milestone's roadmap if any (auto-advance)
    const nextActive = await this.prisma.milestone.findFirst({
      where: { roadmapId, status: 'locked' },
      orderBy: { order: 'asc' },
    });
    if (nextActive) {
      await this.prisma.milestone.update({
        where: { id: nextActive.id },
        data: { status: 'active' },
      });
    }

    return this.getCompletionStats(userId, roadmapId);
  }

  async getCompletionStats(userId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
      include: {
        milestones: {
          include: { tasks: true },
        },
      },
    });
    if (!roadmap) return null;

    const allTasks = roadmap.milestones.flatMap((m) => m.tasks);
    const completedTasks = allTasks.filter((t) => t.status === 'completed');

    // Aggregate XP earned for this roadmap's tasks
    const xpEvents = await this.prisma.xPEvent.findMany({
      where: {
        userId,
        source: { in: ['task_complete', 'milestone_complete'] },
        createdAt: { gte: roadmap.createdAt },
      },
    });
    const totalXpEarned = xpEvents.reduce((sum, e) => sum + e.amount, 0);

    // Get time invested from quest completions
    const completions = await this.prisma.questCompletion.findMany({
      where: {
        userId,
        taskId: { in: completedTasks.map((t) => t.id) },
      },
    });
    const timeInvestedMinutes = Math.round(
      completions.reduce((sum, c) => sum + (c.timeSpentSeconds ?? 0), 0) / 60,
    );

    // Get streak info
    const streak = await this.prisma.streak.findUnique({ where: { userId } });

    // Get achievements count
    const achievementCount = await this.prisma.achievementUnlock.count({
      where: {
        userId,
        unlockedAt: { gte: roadmap.createdAt },
      },
    });

    // Get mastered skills
    const masteredReviews = await this.prisma.reviewItem.findMany({
      where: { userId, masteryLevel: { gte: 5 } },
      select: { skillDomain: true },
    });
    const skillsMastered = [...new Set(masteredReviews.map((r) => r.skillDomain).filter(Boolean))] as string[];

    return {
      roadmapId,
      completedAt: new Date().toISOString(),
      totalQuestsCompleted: completedTasks.length,
      totalXpEarned,
      bestStreak: streak?.longestStreak ?? 0,
      skillsMastered,
      timeInvestedMinutes,
      achievementsUnlockedCount: achievementCount,
      trophyAchievementId: 'roadmap_complete',
    };
  }

  // ─── BL-007: Trending Domains (GDPR: min 50 users/group) ──

  async getTrendingDomains() {
    // Aggregate skill domains across all users — only show groups with ≥50 users
    const trending = await this.prisma.$queryRaw<
      { skillDomain: string; heroCount: number; growthPercent: number; avgCompletionWeeks: number }[]
    >`
      SELECT
        t.skill_domain AS "skillDomain",
        COUNT(DISTINCT r.user_id)::int AS "heroCount",
        0 AS "growthPercent",
        ROUND(AVG(r.duration_days) / 7.0)::int AS "avgCompletionWeeks"
      FROM ods.task t
      JOIN ods.milestone m ON m.id = t.milestone_id
      JOIN ods.roadmap r ON r.id = m.roadmap_id
      WHERE t.skill_domain IS NOT NULL
        AND r.status IN ('active', 'completed')
      GROUP BY t.skill_domain
      HAVING COUNT(DISTINCT r.user_id) >= 50
      ORDER BY "heroCount" DESC
      LIMIT 5
    `;

    return trending;
  }

  async getTodaysTasks(userId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { userId, status: 'active' },
      include: {
        milestones: {
          where: { status: 'active' },
          include: {
            tasks: {
              where: { status: { in: ['available', 'in_progress'] } },
              orderBy: { order: 'asc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!roadmap) return [];

    return roadmap.milestones.flatMap((m) => m.tasks);
  }
}

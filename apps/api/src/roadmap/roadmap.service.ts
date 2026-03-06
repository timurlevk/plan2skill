import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapGenerator } from '../ai/generators/roadmap.generator';
import { DomainClassifierService } from '../ai/generators/domain-classifier.service';
import { RoadmapGateway } from './roadmap.gateway';
import { CacheService } from '../ai/core/cache.service';
import type { GenerateRoadmapInput } from '@plan2skill/types';

@Injectable()
export class RoadmapService {
  private static readonly ROADMAP_LIMITS: Record<string, number> = {
    free: 2,
    pro: 7,
    champion: 15,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly roadmapGenerator: RoadmapGenerator,
    private readonly domainClassifier: DomainClassifierService,
    @Inject(forwardRef(() => RoadmapGateway))
    private readonly gateway: RoadmapGateway,
    private readonly cacheService: CacheService,
  ) {}

  async validateRoadmapLimit(userId: string) {
    const progression = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { subscriptionTier: true },
    });
    const tier = progression?.subscriptionTier ?? 'free';
    const limit = RoadmapService.ROADMAP_LIMITS[tier] ?? 2;
    const current = await this.prisma.roadmap.count({
      where: { userId, status: { in: ['active', 'generating'] } },
    });
    return { allowed: current < limit, tier, current, limit };
  }

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
    // Tier gate — check roadmap limit before creating
    const gate = await this.validateRoadmapLimit(userId);
    if (!gate.allowed) {
      return { roadmapId: null, status: 'tier_limit' as const, tierInfo: gate };
    }

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
    // SSE: context enrichment phase
    this.gateway.emitProgress(roadmapId, {
      type: 'progress',
      data: { phase: 'context', percent: 10, message: 'Building hero context...' },
    });

    // SSE: generation phase
    this.gateway.emitProgress(roadmapId, {
      type: 'progress',
      data: { phase: 'generating', percent: 30, message: 'Forging quest line...' },
    });

    const aiResult = await this.roadmapGenerator.generate(userId, {
      goal: input.goal,
      dailyMinutes: input.dailyMinutes,
      currentRole: input.currentRole,
      experienceLevel: input.experienceLevel,
      selectedTools: input.selectedTools,
      superpower: input.superpower,
    });

    // SSE: saving phase
    this.gateway.emitProgress(roadmapId, {
      type: 'progress',
      data: { phase: 'saving', percent: 60, message: 'Inscribing milestones...' },
    });

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

      await this.prisma.task.createMany({
        data: ms.tasks.map((task, j) => ({
          milestoneId: milestone.id,
          title: task.title,
          description: task.description,
          taskType: task.taskType,
          questType: task.questType ?? 'knowledge',
          difficultyTier: task.difficultyTier ?? 3,
          estimatedMinutes: task.estimatedMinutes,
          xpReward: task.xpReward,
          coinReward: task.coinReward,
          rarity: task.rarity,
          skillDomain: task.skillDomain,
          bloomLevel: task.bloomLevel,
          status: i === 0 && j === 0 ? 'available' : 'locked',
          order: j,
        })),
      });

      // SSE: emit milestone progress
      const percent = 60 + Math.round((i + 1) / aiResult.milestones.length * 30);
      this.gateway.emitProgress(roadmapId, {
        type: 'milestone',
        data: { index: i, title: ms.title, taskCount: ms.tasks.length, percent },
      });
    }

    // Domain classification — one-time cheap LLM call to classify the domain
    this.gateway.emitProgress(roadmapId, {
      type: 'progress',
      data: { phase: 'classifying', percent: 92, message: 'Analyzing domain...' },
    });

    let domainData: Record<string, unknown> = {};

    try {
      const classification = await this.domainClassifier.generate(userId, {
        goal: input.goal,
        title: aiResult.title,
      });
      domainData = {
        domainCategories: classification.categories,
        hasCodingComponent: classification.hasCodingComponent,
        hasPhysicalComponent: classification.hasPhysicalComponent,
        domainMeta: classification as object,
      };
    } catch (err) {
      console.warn('[RoadmapService] Domain classification failed, continuing without:', (err as Error).message);
    }

    // Update roadmap
    await this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: {
        title: aiResult.title,
        description: aiResult.description,
        status: 'active',
        ...domainData,
      },
    });

    // Cache invalidation — roadmap structure changed
    this.cacheService.invalidateForEvent(userId, 'roadmap_change').catch(() => {});

    // SSE: complete
    this.gateway.emitProgress(roadmapId, {
      type: 'complete',
      data: { roadmapId, percent: 100 },
    });
  }

  // ─── BL-007: Roadmap Completion ──────────────────────────────

  async completeRoadmap(userId: string, roadmapId: string) {
    await this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'completed', progress: 100 },
    });

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

    // Get quest completions scoped to this roadmap's tasks
    const roadmapTaskIds = allTasks.map((t) => t.id);
    const completions = await this.prisma.questCompletion.findMany({
      where: {
        userId,
        taskId: { in: roadmapTaskIds },
      },
    });

    // Aggregate XP earned for this roadmap only (from quest completions)
    const totalXpEarned = completions.reduce(
      (sum, c) => sum + c.baseXp + c.bonusXp,
      0,
    );

    // Get time invested from quest completions
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

  // ─── Phase 5H: Roadmap Adjust/Pause/Resume ──────────────────

  async adjustRoadmap(
    userId: string,
    roadmapId: string,
    input: {
      type: 'goals' | 'pace' | 'regen' | 'add_topic';
      newGoal?: string;
      newDailyMinutes?: number;
      newInterests?: string[];
    },
  ) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, status: 'active' },
      include: { milestones: { include: { tasks: true }, orderBy: { order: 'asc' } } },
    });
    if (!roadmap) throw new NotFoundException('Quest line not found');

    switch (input.type) {
      case 'pace': {
        const newMinutes = input.newDailyMinutes ?? roadmap.dailyMinutes;
        await this.prisma.roadmap.update({
          where: { id: roadmapId },
          data: { dailyMinutes: newMinutes },
        });
        // Reschedule remaining tasks' estimated minutes
        const incompleteTasks = roadmap.milestones
          .flatMap((m) => m.tasks)
          .filter((t) => t.status !== 'completed');
        for (const task of incompleteTasks) {
          await this.prisma.task.update({
            where: { id: task.id },
            data: { estimatedMinutes: newMinutes },
          });
        }
        break;
      }
      case 'goals': {
        if (input.newGoal) {
          await this.prisma.roadmap.update({
            where: { id: roadmapId },
            data: { goal: input.newGoal, title: `${input.newGoal} Roadmap` },
          });
        }
        // Regenerate non-completed milestones via AI (async)
        await this.regenRemainingTasks(roadmapId, userId, roadmap);
        break;
      }
      case 'regen': {
        await this.regenRemainingTasks(roadmapId, userId, roadmap);
        break;
      }
      case 'add_topic': {
        // Add new tasks to the first non-completed milestone
        const activeMilestone = roadmap.milestones.find(
          (m) => m.status === 'active',
        );
        if (activeMilestone && input.newInterests?.length) {
          const maxOrder = Math.max(...activeMilestone.tasks.map((t) => t.order), 0);
          for (let i = 0; i < Math.min(input.newInterests.length, 5); i++) {
            await this.prisma.task.create({
              data: {
                milestoneId: activeMilestone.id,
                title: `Explore: ${input.newInterests[i]}`,
                description: `Deep dive into ${input.newInterests[i]} — added to your quest line`,
                taskType: 'article',
                estimatedMinutes: roadmap.dailyMinutes,
                xpReward: 30,
                coinReward: 8,
                rarity: 'uncommon',
                status: 'available',
                order: maxOrder + i + 1,
                skillDomain: input.newInterests[i] ?? null,
              },
            });
          }
        }
        break;
      }
    }

    // Cache invalidation — roadmap structure changed
    this.cacheService.invalidateForEvent(userId, 'roadmap_change').catch(() => {});

    return this.getRoadmap(userId, roadmapId);
  }

  private async regenRemainingTasks(
    roadmapId: string,
    userId: string,
    roadmap: { milestones: Array<{ id: string; status: string; tasks: Array<{ id: string; status: string }> }> },
  ) {
    // Delete non-completed tasks from non-completed milestones
    for (const ms of roadmap.milestones) {
      if (ms.status === 'completed') continue;
      const incompleteTasks = ms.tasks.filter((t) => t.status !== 'completed');
      if (incompleteTasks.length > 0) {
        await this.prisma.task.deleteMany({
          where: { id: { in: incompleteTasks.map((t) => t.id) } },
        });
      }
    }

    // Mark as regenerating
    await this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'generating' },
    });

    // AI regeneration for remaining milestones (async, fire-and-forget)
    const existingRoadmap = await this.prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: { goal: true, dailyMinutes: true },
    });
    if (!existingRoadmap) return;

    this.roadmapGenerator
      .generate(userId, {
        goal: existingRoadmap.goal,
        dailyMinutes: existingRoadmap.dailyMinutes,
      })
      .then(async (aiResult) => {
        const nonCompletedMilestones = roadmap.milestones.filter(
          (m) => m.status !== 'completed',
        );
        for (
          let i = 0;
          i < Math.min(aiResult.milestones.length, nonCompletedMilestones.length);
          i++
        ) {
          const aiMs = aiResult.milestones[i]!;
          const dbMs = nonCompletedMilestones[i]!;
          for (let j = 0; j < aiMs.tasks.length; j++) {
            const task = aiMs.tasks[j]!;
            await this.prisma.task.create({
              data: {
                milestoneId: dbMs.id,
                title: task.title,
                description: task.description,
                taskType: task.taskType,
                estimatedMinutes: task.estimatedMinutes,
                xpReward: task.xpReward,
                coinReward: task.coinReward,
                rarity: task.rarity,
                skillDomain: task.skillDomain,
                bloomLevel: task.bloomLevel,
                status: 'available',
                order: j,
              },
            });
          }
        }
        await this.prisma.roadmap.update({
          where: { id: roadmapId },
          data: { status: 'active' },
        });
      })
      .catch((err) => {
        console.error('Regen failed:', err);
        this.prisma.roadmap
          .update({ where: { id: roadmapId }, data: { status: 'active' } })
          .catch(() => {});
      });
  }

  async pauseRoadmap(userId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, status: 'active' },
    });
    if (!roadmap) throw new NotFoundException('Active quest line not found');
    return this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'paused' },
    });
  }

  async resumeRoadmap(userId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, status: 'paused' },
    });
    if (!roadmap) throw new NotFoundException('Paused quest line not found');
    return this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'active' },
    });
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

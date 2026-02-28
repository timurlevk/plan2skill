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

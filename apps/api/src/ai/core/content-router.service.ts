import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ContentFormat, DomainCategory, DomainClassification } from './domain-capability';
import { selectContentFormat } from './content-mix.engine';
import type { FormatWeights } from './content-format-matrix';
import { getFormatWeights } from './content-format-matrix';

// ─── Request/Result Types ───────────────────────────────────────

export interface ContentRouteRequest {
  userId: string;
  roadmapId: string;
  milestoneId: string;
  bloomLevel: string;
  subscriptionTier: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ContentRouteResult {
  format: ContentFormat;
  generatorKey: string;
  formatWeights: FormatWeights;
}

// ─── Format → Generator Key mapping ────────────────────────────

const FORMAT_GENERATOR_MAP: Record<ContentFormat, string> = {
  article: 'quest',
  quiz: 'quiz',
  code_challenge: 'code-challenge',
  video_rec: 'resource',
  project: 'quest',
  reflection: 'quest',
  hands_on: 'quest',
  boss: 'quest',
};

@Injectable()
export class ContentRouterService {
  constructor(private readonly prisma: PrismaService) {}

  async route(request: ContentRouteRequest): Promise<ContentRouteResult> {
    const { userId, roadmapId, milestoneId, bloomLevel, subscriptionTier, proficiency } = request;

    // 1. Load roadmap's domain classification
    const roadmap = await this.prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: {
        domainCategories: true,
        hasCodingComponent: true,
        domainMeta: true,
      },
    });

    const domainMeta = roadmap?.domainMeta as DomainClassification | null;
    const primaryCategory: DomainCategory =
      domainMeta?.primaryCategory ?? 'theoretical';
    const hasCodingComponent = roadmap?.hasCodingComponent ?? false;

    // 2. Load user's recent quest formats (last 5 completed tasks)
    const recentCompletions = await this.prisma.questCompletion.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: { taskId: true },
    });

    const recentTaskIds = recentCompletions.map((c) => c.taskId);
    const recentFormats: ContentFormat[] = [];

    if (recentTaskIds.length > 0) {
      const recentContents = await this.prisma.questContent.findMany({
        where: { taskId: { in: recentTaskIds } },
        select: { taskId: true, contentFormat: true },
      });

      // Preserve order from recentCompletions
      for (const taskId of recentTaskIds) {
        const content = recentContents.find((c) => c.taskId === taskId);
        if (content) {
          recentFormats.push(content.contentFormat as ContentFormat);
        }
      }
    }

    // 3. Load current milestone's format distribution
    const milestoneTasks = await this.prisma.task.findMany({
      where: { milestoneId },
      select: { id: true },
    });
    const milestoneTaskIds = milestoneTasks.map((t) => t.id);

    const milestoneFormats: ContentFormat[] = [];
    if (milestoneTaskIds.length > 0) {
      const milestoneContents = await this.prisma.questContent.findMany({
        where: { taskId: { in: milestoneTaskIds } },
        select: { contentFormat: true },
      });
      for (const c of milestoneContents) {
        milestoneFormats.push(c.contentFormat as ContentFormat);
      }
    }

    // 4. Call deterministic format selection
    const format = selectContentFormat({
      bloomLevel,
      domainCategory: primaryCategory,
      proficiency,
      subscriptionTier,
      recentFormats,
      milestoneFormats,
      hasCodingComponent,
    });

    // 5. Return result
    const generatorKey = FORMAT_GENERATOR_MAP[format];
    const formatWeights = getFormatWeights(bloomLevel, primaryCategory);

    return { format, generatorKey, formatWeights };
  }
}

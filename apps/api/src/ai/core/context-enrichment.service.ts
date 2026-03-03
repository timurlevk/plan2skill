import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  GeneratorContext,
  UserProfileContext,
  LearningContext,
  CharacterContext,
  PerformanceContext,
  NarrativeContext,
} from './types';
import { GENERATOR_CONTEXT_BUDGETS } from './types';

@Injectable()
export class ContextEnrichmentService {
  private readonly logger = new Logger(ContextEnrichmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async build(userId: string, generatorType: string): Promise<GeneratorContext> {
    // 6 parallel queries
    const [user, progression, character, streak, skillElos, recentCompletions] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        }),
        this.prisma.userProgression.findUnique({
          where: { userId },
          select: {
            totalXp: true,
            level: true,
            subscriptionTier: true,
          },
        }),
        this.prisma.character.findUnique({
          where: { userId },
          select: {
            characterId: true,
            archetypeId: true,
            evolutionTier: true,
            strength: true,
            intelligence: true,
            charisma: true,
            constitution: true,
            dexterity: true,
            wisdom: true,
          },
        }),
        this.prisma.streak.findUnique({
          where: { userId },
          select: { currentStreak: true, longestStreak: true },
        }),
        this.prisma.skillElo.findMany({
          where: { userId },
          orderBy: { elo: 'desc' },
          take: 10,
          select: { skillDomain: true, elo: true },
        }),
        this.prisma.questCompletion.findMany({
          where: {
            userId,
            completedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 50,
          select: {
            questType: true,
            qualityScore: true,
            timeSpentSeconds: true,
            task: {
              select: {
                estimatedMinutes: true,
                taskType: true,
                difficultyTier: true,
              },
            },
          },
        }),
      ]);

    // Build full context with graceful defaults
    const userProfile: UserProfileContext = {
      userId,
      level: progression?.level ?? 1,
      totalXp: progression?.totalXp ?? 0,
      subscriptionTier: progression?.subscriptionTier ?? 'free',
      archetypeId: character?.archetypeId,
      characterId: character?.characterId,
      evolutionTier: character?.evolutionTier,
    };

    const learningContext: LearningContext = {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      recentCompletions: recentCompletions.length,
      averageQualityScore: this.average(
        recentCompletions.map((c) => c.qualityScore).filter(Boolean) as number[],
      ),
      skillElos: skillElos.map((e) => ({
        skillDomain: e.skillDomain,
        elo: e.elo,
      })),
    };

    const characterContext: CharacterContext | undefined = character
      ? {
          characterId: character.characterId,
          archetypeId: character.archetypeId,
          evolutionTier: character.evolutionTier,
          attributes: {
            strength: character.strength,
            intelligence: character.intelligence,
            charisma: character.charisma,
            constitution: character.constitution,
            dexterity: character.dexterity,
            wisdom: character.wisdom,
          },
        }
      : undefined;

    const performanceContext: PerformanceContext = this.buildPerformanceContext(
      recentCompletions,
    );

    const narrativeContext: NarrativeContext | undefined =
      await this.buildNarrativeContext(userId);

    // Apply per-generator budget filter
    const budget = GENERATOR_CONTEXT_BUDGETS[generatorType] ?? ['userProfile'];
    const context: GeneratorContext = { userProfile };

    if (budget.includes('learningContext')) {
      context.learningContext = learningContext;
    }
    if (budget.includes('characterContext') && characterContext) {
      context.characterContext = characterContext;
    }
    if (budget.includes('performanceContext')) {
      context.performanceContext = performanceContext;
    }
    if (budget.includes('narrativeContext') && narrativeContext) {
      context.narrativeContext = narrativeContext;
    }

    return context;
  }

  private buildPerformanceContext(
    completions: Array<{
      questType: string;
      qualityScore: number | null;
      timeSpentSeconds: number | null;
      task: {
        estimatedMinutes: number;
        taskType: string;
        difficultyTier: number;
      };
    }>,
  ): PerformanceContext {
    if (completions.length === 0) {
      return {
        averageTimeSpentRatio: 1.0,
        completionRate: 0,
        preferredTaskTypes: [],
        difficultyDistribution: {},
      };
    }

    // Average time spent ratio (actual / estimated)
    const ratios = completions
      .filter((c) => c.timeSpentSeconds && c.task.estimatedMinutes > 0)
      .map(
        (c) => c.timeSpentSeconds! / (c.task.estimatedMinutes * 60),
      );
    const averageTimeSpentRatio = this.average(ratios) || 1.0;

    // Task type frequency
    const typeCounts: Record<string, number> = {};
    for (const c of completions) {
      typeCounts[c.task.taskType] = (typeCounts[c.task.taskType] ?? 0) + 1;
    }
    const preferredTaskTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    // Difficulty distribution
    const difficultyDistribution: Record<string, number> = {};
    for (const c of completions) {
      const tier = String(c.task.difficultyTier);
      difficultyDistribution[tier] =
        (difficultyDistribution[tier] ?? 0) + 1;
    }

    return {
      averageTimeSpentRatio,
      completionRate: completions.length, // raw count for context
      preferredTaskTypes,
      difficultyDistribution,
    };
  }

  private async buildNarrativeContext(
    userId: string,
  ): Promise<NarrativeContext | undefined> {
    const pref = await this.prisma.narrativePreference.findUnique({
      where: { userId },
      select: { narrativeMode: true, lastReadEpisode: true },
    });
    if (!pref) return undefined;

    const latestSeason = await this.prisma.season.findFirst({
      where: { status: 'active' },
      orderBy: { seasonNumber: 'desc' },
      select: { seasonNumber: true },
    });

    return {
      currentSeason: latestSeason?.seasonNumber ?? 1,
      lastEpisodeNumber: pref.lastReadEpisode ?? 0,
      narrativeMode: pref.narrativeMode,
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

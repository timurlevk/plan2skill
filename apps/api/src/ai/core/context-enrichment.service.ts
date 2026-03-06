import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  GeneratorContext,
  DomainModelContext,
  LearnerProfileContext,
  NarrativeContext,
  RoadmapContextSummary,
  QuestSessionContext,
  LedgerContext,
} from './types';
import { GENERATOR_CONTEXT_BUDGETS } from './types';
import {
  ARCHETYPE_BLUEPRINTS,
  type ArchetypeBlueprint,
} from './archetype-blueprints';

const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;

@Injectable()
export class ContextEnrichmentService {
  private readonly logger = new Logger(ContextEnrichmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async build(
    userId: string,
    generatorType: string,
    taskId?: string,
  ): Promise<GeneratorContext> {
    const budget = GENERATOR_CONTEXT_BUDGETS[generatorType] ?? [];

    // Shared character query (used by both L0 and L1) — avoids duplicate DB hit
    const character = await this.prisma.character.findUnique({
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
    });

    // L0 + L1 always loaded in parallel
    const [domainModel, learnerProfile] = await Promise.all([
      this.buildDomainModel(character),
      this.buildLearnerProfile(userId, character),
    ]);

    // Warn if questSession requested but no taskId provided
    if (budget.includes('questSession') && !taskId) {
      this.logger.warn(`Generator '${generatorType}' requests questSession but no taskId provided`);
    }

    // Extra layers loaded based on budget
    const [narrativeContext, roadmapContext, questSession, ledgerContext] =
      await Promise.all([
        budget.includes('narrativeContext')
          ? this.buildNarrativeContext(userId)
          : undefined,
        budget.includes('roadmapContext')
          ? this.buildRoadmapContext(userId)
          : undefined,
        budget.includes('questSession') && taskId
          ? this.buildQuestSession(userId, taskId)
          : undefined,
        budget.includes('ledgerContext')
          ? this.buildLedgerContext(userId)
          : undefined,
      ]);

    // Token compression for BUDGET tier generators
    const compressedRoadmap = roadmapContext
      ? this.compressRoadmapContext(roadmapContext, generatorType)
      : undefined;
    const compressedLedger = ledgerContext
      ? this.compressLedgerContext(ledgerContext, generatorType)
      : undefined;

    return {
      domainModel,
      learnerProfile,
      roadmapContext: compressedRoadmap,
      questSession,
      ledgerContext: compressedLedger,
      narrativeContext,
    };
  }

  // ─── L0: Domain Model ──────────────────────────────────────────

  private buildDomainModel(
    character: { archetypeId: string } | null,
  ): DomainModelContext {
    let archetypeBlueprint: DomainModelContext['archetypeBlueprint'];
    if (character?.archetypeId) {
      const bp: ArchetypeBlueprint | undefined =
        ARCHETYPE_BLUEPRINTS[character.archetypeId];
      if (bp) {
        archetypeBlueprint = {
          archetypeId: bp.archetypeId,
          questMix: bp.questMix,
          preferredBloomLevels: bp.preferredBloomLevels,
          motivationalStyle: bp.motivationalStyle,
          narrativeTone: bp.narrativeTone,
        };
      }
    }

    return {
      bloomLevels: BLOOM_LEVELS,
      archetypeBlueprint,
    };
  }

  // ─── L1: Learner Profile ───────────────────────────────────────

  private async buildLearnerProfile(
    userId: string,
    character: {
      characterId: string;
      archetypeId: string;
      evolutionTier: string;
      strength: number;
      intelligence: number;
      charisma: number;
      constitution: number;
      dexterity: number;
      wisdom: number;
    } | null,
  ): Promise<LearnerProfileContext> {
    const [
      user,
      progression,
      streak,
      skillElos,
      recentCompletions,
      onboarding,
      dueReviewCount,
      masteryGroups,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, locale: true },
      }),
      this.prisma.userProgression.findUnique({
        where: { userId },
        select: { totalXp: true, level: true, subscriptionTier: true },
      }),
      this.prisma.streak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true },
      }),
      this.prisma.skillElo.findMany({
        where: { userId },
        orderBy: { elo: 'desc' },
        take: 10,
        select: { skillDomain: true, elo: true, assessmentCount: true },
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
      // NEW: OnboardingSubmission (previously write-only)
      this.prisma.onboardingSubmission.findUnique({
        where: { userId },
        select: {
          dreamGoal: true,
          interests: true,
          careerTarget: true,
          domain: true,
        },
      }),
      // NEW: ReviewItem — due review count
      this.prisma.reviewItem.count({
        where: { userId, nextReview: { lte: new Date() } },
      }),
      // NEW: ReviewItem — mastery distribution
      this.prisma.reviewItem.groupBy({
        by: ['masteryLevel'],
        where: { userId },
        _count: true,
      }),
    ]);

    // Build performance data from recent completions
    const perf = this.buildPerformanceData(recentCompletions);

    // Build mastery distribution record
    const masteryDistribution: Record<string, number> = {};
    for (const g of masteryGroups) {
      masteryDistribution[String(g.masteryLevel)] = g._count;
    }

    return {
      // UserProfile fields
      userId,
      level: progression?.level ?? 1,
      totalXp: progression?.totalXp ?? 0,
      subscriptionTier: progression?.subscriptionTier ?? 'free',
      locale: user?.locale ?? 'en',
      archetypeId: character?.archetypeId,
      characterId: character?.characterId,
      evolutionTier: character?.evolutionTier,
      // Character attributes (flattened)
      characterAttributes: character
        ? {
            strength: character.strength,
            intelligence: character.intelligence,
            charisma: character.charisma,
            constitution: character.constitution,
            dexterity: character.dexterity,
            wisdom: character.wisdom,
          }
        : undefined,
      // Learning context
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      recentCompletions: recentCompletions.length,
      averageQualityScore: this.average(
        recentCompletions.map((c) => c.qualityScore).filter((v): v is number => v != null),
      ),
      skillElos: skillElos.map((e) => ({
        skillDomain: e.skillDomain,
        elo: e.elo,
        assessmentCount: e.assessmentCount,
      })),
      // Performance context
      averageTimeSpentRatio: perf.averageTimeSpentRatio,
      preferredTaskTypes: perf.preferredTaskTypes,
      difficultyDistribution: perf.difficultyDistribution,
      // Onboarding (previously write-only)
      dreamGoal: onboarding?.dreamGoal ?? undefined,
      interests: (onboarding?.interests as string[] | null) ?? undefined,
      careerTarget: onboarding?.careerTarget ?? undefined,
      domain: onboarding?.domain ?? undefined,
      // Review items (previously write-only)
      dueReviewCount,
      masteryDistribution,
    };
  }

  // ─── L2: Roadmap Context ──────────────────────────────────────

  private async buildRoadmapContext(
    userId: string,
  ): Promise<RoadmapContextSummary | undefined> {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { userId, status: 'active' },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              select: { id: true, status: true, skillDomain: true },
            },
          },
        },
      },
    });

    if (!roadmap) return undefined;

    // Get onboarding assessments for calibration
    const onboarding = await this.prisma.onboardingSubmission.findUnique({
      where: { userId },
      select: { assessments: true },
    });

    return {
      roadmapId: roadmap.id,
      title: roadmap.title,
      goal: roadmap.goal,
      dailyMinutes: roadmap.dailyMinutes,
      durationDays: roadmap.durationDays,
      progress: roadmap.progress ?? 0,
      status: roadmap.status,
      milestones: roadmap.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        order: m.order,
        totalTasks: m.tasks.length,
        completedTasks: m.tasks.filter((t) => t.status === 'completed').length,
        skillDomains: [...new Set(m.tasks.map((t) => t.skillDomain).filter(Boolean))] as string[],
      })),
      onboardingAssessments: Array.isArray(onboarding?.assessments)
        ? (onboarding.assessments as Array<{ domain: string; level: string; score: number }>)
        : undefined,
    };
  }

  // ─── L3: Quest Session ──────────────────────────────────────────

  private async buildQuestSession(
    userId: string,
    taskId: string,
  ): Promise<QuestSessionContext | undefined> {
    const [task, attempts] = await Promise.all([
      this.prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          title: true,
          taskType: true,
          questType: true,
          skillDomain: true,
          bloomLevel: true,
          difficultyTier: true,
          knowledgeCheck: true,
        },
      }),
      this.prisma.taskAttempt.findMany({
        where: { userId, taskId },
        orderBy: { attemptNumber: 'asc' },
        select: {
          attemptNumber: true,
          selectedIndex: true,
          correct: true,
          timeSpentSeconds: true,
          hintsRequested: true,
        },
      }),
    ]);

    if (!task) return undefined;

    const hintsRequestedTotal = attempts.reduce(
      (sum, a) => sum + a.hintsRequested,
      0,
    );
    const totalTimeSpentSeconds = attempts.reduce(
      (sum, a) => sum + (a.timeSpentSeconds ?? 0),
      0,
    );

    const kc = task.knowledgeCheck as {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    } | null;

    return {
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.taskType,
      questType: task.questType,
      skillDomain: task.skillDomain,
      bloomLevel: task.bloomLevel,
      difficultyTier: task.difficultyTier,
      knowledgeCheck: kc ?? undefined,
      attempts: attempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        selectedIndex: a.selectedIndex ?? undefined,
        correct: a.correct ?? undefined,
        timeSpentSeconds: a.timeSpentSeconds ?? undefined,
        hintsRequested: a.hintsRequested,
      })),
      hintsRequestedTotal,
      totalTimeSpentSeconds,
    };
  }

  // ─── L4: Ledger Context ─────────────────────────────────────────

  private async buildLedgerContext(
    userId: string,
  ): Promise<LedgerContext | undefined> {
    const insights = await this.prisma.learnerInsight.findMany({
      where: {
        userId,
        validUntil: { gt: new Date() },
      },
      orderBy: { confidence: 'desc' },
      take: 10,
      select: {
        insightType: true,
        skillDomain: true,
        title: true,
        description: true,
        confidence: true,
      },
    });

    if (insights.length === 0) return undefined;

    return {
      insights: insights.map((i) => ({
        insightType: i.insightType,
        skillDomain: i.skillDomain,
        title: i.title,
        description: i.description,
        confidence: i.confidence,
      })),
    };
  }

  // ─── Narrative Context ─────────────────────────────────────────

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

  // ─── Performance Data Builder ──────────────────────────────────

  private buildPerformanceData(
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
  ): {
    averageTimeSpentRatio: number;
    preferredTaskTypes: string[];
    difficultyDistribution: Record<string, number>;
  } {
    if (completions.length === 0) {
      return {
        averageTimeSpentRatio: 1.0,
        preferredTaskTypes: [],
        difficultyDistribution: {},
      };
    }

    const ratios = completions
      .filter((c) => c.timeSpentSeconds && c.task.estimatedMinutes > 0)
      .map((c) => c.timeSpentSeconds! / (c.task.estimatedMinutes * 60));
    const averageTimeSpentRatio = this.average(ratios) || 1.0;

    const typeCounts: Record<string, number> = {};
    for (const c of completions) {
      typeCounts[c.task.taskType] = (typeCounts[c.task.taskType] ?? 0) + 1;
    }
    const preferredTaskTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    const difficultyDistribution: Record<string, number> = {};
    for (const c of completions) {
      const tier = String(c.task.difficultyTier);
      difficultyDistribution[tier] = (difficultyDistribution[tier] ?? 0) + 1;
    }

    return {
      averageTimeSpentRatio,
      preferredTaskTypes,
      difficultyDistribution,
    };
  }

  // ─── Token Compression ──────────────────────────────────────────

  /** Generators that receive compressed context (active milestone only, top 3 errors) to save tokens */
  private static readonly COMPRESSED_CONTEXT_GENERATORS = new Set([
    'fun-fact',
    'quiz',
    'motivational',
    'interest-suggestion',
    'resource',
    'recommendation',
    'onboarding-assessment',
    'milestone-suggestion',
  ]);

  /**
   * For BUDGET tier generators: only include active milestone (not all milestones).
   * Saves ~60% of roadmap context tokens.
   */
  private compressRoadmapContext(
    rc: RoadmapContextSummary,
    generatorType: string,
  ): RoadmapContextSummary {
    if (!ContextEnrichmentService.COMPRESSED_CONTEXT_GENERATORS.has(generatorType)) {
      return rc;
    }
    // Keep only active/in_progress milestone
    const activeMilestones = rc.milestones.filter(
      (m) => m.status === 'active' || m.status === 'in_progress',
    );
    return { ...rc, milestones: activeMilestones.slice(0, 1) };
  }

  /**
   * For BUDGET tier generators: only top 3 error patterns + summary.
   * Saves ~50% of ledger context tokens.
   */
  private compressLedgerContext(
    lc: LedgerContext,
    generatorType: string,
  ): LedgerContext {
    if (!ContextEnrichmentService.COMPRESSED_CONTEXT_GENERATORS.has(generatorType)) {
      return lc;
    }
    // Keep top 3 error_pattern/misconception + all summary insights
    const errorInsights = lc.insights
      .filter((i) => i.insightType === 'error_pattern' || i.insightType === 'misconception')
      .slice(0, 3);
    const summaries = lc.insights.filter((i) => i.insightType === 'summary');
    return { insights: [...errorInsights, ...summaries] };
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentRouterService } from '../ai/core/content-router.service';
import { ContentBudgetService } from '../ai/core/content-budget.service';
import type { AiFeature } from '../ai/core/content-budget.service';
import { QuizGenerator } from '../ai/generators/quiz.generator';
import { ResourceGenerator } from '../ai/generators/resource.generator';
import { FunFactGenerator } from '../ai/generators/fun-fact.generator';
import { ArticleBodyGenerator } from '../ai/generators/article-body.generator';
import { CodeChallengeGenerator } from '../ai/generators/code-challenge.generator';
import { MotivationalGenerator } from '../ai/generators/motivational.generator';
import { validateGeneratedContent } from '../ai/core/content-validator';
import { QuestService } from './quest.service';
import type { DomainClassification } from '../ai/core/domain-capability';
import type { AiQuestAssistantResult } from '../ai/schemas/quest-assistant.schema';
import type { AiMotivationalResult } from '../ai/schemas/motivational.schema';
import type {
  QuestContentPackage,
  CodeChallengeContent,
  QuizQuestion,
  ResourceItem,
  FunFactItem,
  LockedFeature,
} from '@plan2skill/types';

@Injectable()
export class QuestContentService {
  private readonly logger = new Logger(QuestContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentRouter: ContentRouterService,
    private readonly contentBudget: ContentBudgetService,
    private readonly quizGenerator: QuizGenerator,
    private readonly resourceGenerator: ResourceGenerator,
    private readonly funFactGenerator: FunFactGenerator,
    private readonly articleBodyGenerator: ArticleBodyGenerator,
    private readonly codeChallengeGenerator: CodeChallengeGenerator,
    private readonly motivationalGenerator: MotivationalGenerator,
    private readonly questService: QuestService,
  ) {}

  async assembleContent(taskId: string, userId: string): Promise<QuestContentPackage> {
    // 1. Load task with milestone → roadmap
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        milestone: {
          include: {
            roadmap: {
              select: {
                id: true,
                domainMeta: true,
                domainCategories: true,
                hasCodingComponent: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return this.emptyPackage(taskId, 'failed');
    }

    // 2. Check existing QuestContent
    const existing = await this.prisma.questContent.findUnique({
      where: { taskId },
    });

    if (existing?.status === 'ready') {
      return this.buildPackageFromDb(taskId, userId, existing, task);
    }

    if (existing?.status === 'generating') {
      return this.emptyPackage(taskId, 'generating');
    }

    // 3. Upsert with status: 'generating'
    await this.prisma.questContent.upsert({
      where: { taskId },
      create: { taskId, status: 'generating' },
      update: { status: 'generating' },
    });

    // 4. Load user progression for tier info
    const progression = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { subscriptionTier: true },
    });
    const tier = progression?.subscriptionTier ?? 'free';

    // Extract domain info
    const domainMeta = task.milestone.roadmap.domainMeta as DomainClassification | null;
    const primaryCategory = domainMeta?.primaryCategory ?? 'theoretical';
    const hasCodingComponent = task.milestone.roadmap.hasCodingComponent ?? false;
    const skillDomain = task.skillDomain ?? task.milestone.roadmap.domainCategories?.[0] ?? 'general';
    const bloomLevel = task.bloomLevel ?? 'understand';

    // 5. Dispatch generators in parallel
    const [articleResult, quizResult, resourceResult, funFactResult, codeChallengeResult] = await Promise.allSettled([
      // Article — always generated
      this.articleBodyGenerator.generate(userId, {
        skillDomain,
        taskTitle: task.title,
        bloomLevel,
        taskDescription: task.description ?? '',
        domainCategory: primaryCategory,
        hasCodingComponent,
      }),
      // Quiz — Pro+ only (Free uses existing knowledgeCheck)
      tier !== 'free'
        ? this.quizGenerator.generate(userId, {
            skillDomain,
            bloomLevel,
            questionCount: 5,
            context: task.title,
          })
        : Promise.resolve(null),
      // Resources — Pro+ only
      tier !== 'free'
        ? this.resourceGenerator.generate(userId, {
            skillDomain,
            level: this.mapBloomToLevel(bloomLevel),
            taskTitle: task.title,
          })
        : Promise.resolve(null),
      // Fun facts — Pro+ only
      tier !== 'free'
        ? this.funFactGenerator.generate(userId, {
            skillDomain,
            topic: task.title,
          })
        : Promise.resolve(null),
      // Code challenge — Pro+ only, coding domains only
      tier !== 'free' && hasCodingComponent
        ? this.codeChallengeGenerator.generate(userId, {
            language: (domainMeta?.primaryLanguage as string | undefined) ?? 'javascript',
            skillDomain,
            bloomLevel,
            difficulty: this.mapBloomToDifficulty(bloomLevel),
          })
        : Promise.resolve(null),
    ]);

    // 6. Extract results, validate
    const articleBody = this.extractSettled(articleResult, 'article-body');
    const quiz = this.extractSettled(quizResult, 'quiz');
    const resources = this.extractSettled(resourceResult, 'resource');
    const funFacts = this.extractSettled(funFactResult, 'fun-fact');
    const codeChallenge = this.extractSettled(codeChallengeResult, 'code-challenge');

    // Validate article body
    let validatedArticle: string | null = null;
    if (articleBody?.articleBody) {
      const classification: DomainClassification = domainMeta ?? {
        categories: [primaryCategory],
        primaryCategory,
        hasCodingComponent,
        hasPhysicalComponent: false,
        hasCreativeComponent: false,
        primaryLanguage: null,
        suggestedTooling: [],
      };
      const validation = validateGeneratedContent('article', articleBody.articleBody, classification);
      if (validation.valid) {
        validatedArticle = articleBody.articleBody;
      } else {
        this.logger.warn(`Article validation failed: ${validation.errors.join(', ')}`);
        validatedArticle = articleBody.articleBody; // still save, validation is advisory
      }
    }

    // Determine final status
    const hasArticle = validatedArticle !== null;
    const finalStatus = hasArticle ? 'ready' : 'failed';

    // 7. Save to QuestContent
    await this.prisma.questContent.update({
      where: { taskId },
      data: {
        status: finalStatus,
        articleBody: validatedArticle,
        quizQuestions: quiz?.questions ? (quiz.questions as any) : undefined,
        resources: resources?.resources ? (resources.resources as any) : undefined,
        funFacts: funFacts?.facts ? (funFacts.facts as any) : undefined,
        codeChallenge: codeChallenge ? (codeChallenge as any) : undefined,
        contentFormat: 'article',
        generatedAt: new Date(),
        generatorMeta: {
          tier,
          articleGenerated: hasArticle,
          quizGenerated: quiz?.questions != null,
          resourcesGenerated: resources?.resources != null,
          funFactsGenerated: funFacts?.facts != null,
          codeChallengeGenerated: codeChallenge != null,
        },
      },
    });

    // 8. Build and return package with tier gating
    const saved = await this.prisma.questContent.findUnique({ where: { taskId } });
    if (!saved) {
      return this.emptyPackage(taskId, 'failed');
    }

    return this.buildPackageFromDb(taskId, userId, saved, task);
  }

  // ─── Feature Unlock (Phase D) ────────────────────────────────

  private static readonly FEATURE_COIN_COST: Record<string, number> = {
    code_challenge: 10,
    resources: 5,
    fun_facts: 3,
  };

  async unlockFeature(
    userId: string,
    taskId: string,
    feature: 'code_challenge' | 'resources' | 'fun_facts',
  ): Promise<{ ok: boolean; remaining: number; feature: string; error?: string }> {
    // Validate task ownership
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        skillDomain: true,
        bloomLevel: true,
        milestone: {
          select: {
            roadmap: {
              select: {
                userId: true,
                domainMeta: true,
                domainCategories: true,
                hasCodingComponent: true,
              },
            },
          },
        },
      },
    });
    if (!task || task.milestone.roadmap.userId !== userId) {
      return { ok: false, remaining: 0, feature, error: 'Task not found or unauthorized' };
    }

    // Check if already unlocked
    const existing = await this.prisma.featureUnlock.findUnique({
      where: { userId_taskId_feature: { userId, taskId, feature } },
    });
    if (existing) {
      return { ok: true, remaining: 0, feature }; // idempotent
    }

    // Look up coin cost
    const cost = QuestContentService.FEATURE_COIN_COST[feature];
    if (cost === undefined) {
      return { ok: false, remaining: 0, feature, error: 'Unknown feature' };
    }

    // Spend coins
    const spend = await this.contentBudget.spendCoins(userId, cost);
    if (!spend.ok) {
      return { ok: false, remaining: spend.remaining, feature, error: 'Insufficient coins' };
    }

    // Record unlock
    await this.prisma.featureUnlock.create({
      data: { userId, taskId, feature },
    });

    // Trigger targeted generation for the unlocked feature
    const domainMeta = task.milestone.roadmap.domainMeta as DomainClassification | null;
    const skillDomain = task.skillDomain ?? task.milestone.roadmap.domainCategories?.[0] ?? 'general';
    const bloomLevel = task.bloomLevel ?? 'understand';

    try {
      if (feature === 'code_challenge') {
        const result = await this.codeChallengeGenerator.generate(userId, {
          language: (domainMeta?.primaryLanguage as string | undefined) ?? 'javascript',
          skillDomain,
          bloomLevel,
          difficulty: this.mapBloomToDifficulty(bloomLevel),
        });
        if (result) {
          await this.prisma.questContent.update({
            where: { taskId },
            data: { codeChallenge: result as any },
          });
        }
      } else if (feature === 'resources') {
        const result = await this.resourceGenerator.generate(userId, {
          skillDomain,
          level: this.mapBloomToLevel(bloomLevel),
          taskTitle: task.title,
        });
        if (result?.resources) {
          await this.prisma.questContent.update({
            where: { taskId },
            data: { resources: result.resources as any },
          });
        }
      } else if (feature === 'fun_facts') {
        const result = await this.funFactGenerator.generate(userId, {
          skillDomain,
          topic: task.title,
        });
        if (result?.facts) {
          await this.prisma.questContent.update({
            where: { taskId },
            data: { funFacts: result.facts as any },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`[unlockFeature] Generation failed for ${feature}: ${(err as Error).message}`);
      // Unlock is still recorded — content will be null until regenerated
    }

    return { ok: true, remaining: spend.remaining, feature };
  }

  // ─── AI Assist (Phase C) ──────────────────────────────────────

  async requestAiAssist(
    userId: string,
    taskId: string,
    feature: 'hint' | 'tutor' | 'explain',
  ): Promise<{ allowed: boolean; result?: AiQuestAssistantResult; coinCost: number; remaining: number }> {
    const quota = await this.contentBudget.checkAiQuota(userId, feature);

    if (!quota.allowed) {
      return { allowed: false, coinCost: quota.coinCost, remaining: 0 };
    }

    // Over daily limit but has coins → spend coins
    if (quota.coinCost > 0) {
      const spend = await this.contentBudget.spendCoins(userId, quota.coinCost);
      if (!spend.ok) {
        return { allowed: false, coinCost: quota.coinCost, remaining: 0 };
      }
    }

    // Map feature → quest-assistant mode
    const mode = feature === 'hint' ? 'hint' as const
      : feature === 'explain' ? 'feedback' as const
      : 'reattempt' as const;

    const result = await this.questService.questAssist(userId, taskId, mode);

    // Increment daily usage
    await this.contentBudget.incrementAiUsage(userId, feature);

    return {
      allowed: true,
      result,
      coinCost: quota.coinCost,
      remaining: Math.max(0, quota.remaining - 1),
    };
  }

  async getMotivationalMessage(
    userId: string,
    triggerType: 'streak_milestone' | 'level_up' | 'comeback' | 'daily_start' | 'quest_complete',
    context?: { streakDays?: number; level?: number; characterId?: string },
  ): Promise<AiMotivationalResult> {
    return this.motivationalGenerator.generate(userId, {
      triggerType,
      streakDays: context?.streakDays,
      level: context?.level,
      characterId: context?.characterId,
    });
  }

  async prefetchNextQuests(userId: string, milestoneId: string): Promise<void> {
    const tasks = await this.prisma.task.findMany({
      where: { milestoneId, status: { in: ['available', 'active'] } },
      orderBy: { order: 'asc' },
      take: 2,
      select: { id: true },
    });
    for (const task of tasks) {
      this.assembleContent(task.id, userId)
        .catch((err) => this.logger.warn(`[QuestPrefetch] prefetch failed: ${err.message}`));
    }
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async buildPackageFromDb(
    taskId: string,
    userId: string,
    record: {
      status: string;
      contentFormat: string;
      articleBody: string | null;
      quizQuestions: unknown;
      resources: unknown;
      funFacts: unknown;
      codeChallenge?: unknown;
    },
    task: { knowledgeCheck: unknown },
  ): Promise<QuestContentPackage> {
    const progression = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { subscriptionTier: true },
    });
    const tier = progression?.subscriptionTier ?? 'free';

    const balance = await this.contentBudget.getBalance(userId);

    // Query user's feature unlocks for this task
    const unlocks = await this.prisma.featureUnlock.findMany({
      where: { userId, taskId },
      select: { feature: true },
    });
    const unlockedFeatures = new Set(unlocks.map((u) => u.feature));

    const fullQuiz = record.quizQuestions as QuizQuestion[] | null;
    const fullResources = record.resources as ResourceItem[] | null;
    const fullFunFacts = record.funFacts as FunFactItem[] | null;
    const fullCodeChallenge = (record.codeChallenge as CodeChallengeContent | null) ?? null;

    return this.applyTierGating(
      {
        taskId,
        status: record.status as QuestContentPackage['status'],
        contentFormat: record.contentFormat,
        articleBody: record.articleBody,
        quizQuestions: fullQuiz,
        resources: fullResources,
        funFacts: fullFunFacts,
        codeChallenge: fullCodeChallenge,
        aiHintsRemaining: Math.max(0, balance.limits.dailyHints - balance.aiHintsToday),
        aiTutorAvailable: tier !== 'free',
        lockedFeatures: [],
      },
      tier,
      task.knowledgeCheck,
      unlockedFeatures,
    );
  }

  private applyTierGating(
    content: QuestContentPackage,
    tier: string,
    knowledgeCheck: unknown,
    unlockedFeatures: Set<string> = new Set(),
  ): QuestContentPackage {
    if (tier === 'free') {
      // Truncate article to ~200 words
      if (content.articleBody) {
        const words = content.articleBody.split(/\s+/);
        if (words.length > 200) {
          content.articleBody = words.slice(0, 200).join(' ') + '...';
        }
      }

      // Free: 1 quiz question from existing knowledgeCheck
      if (knowledgeCheck && typeof knowledgeCheck === 'object') {
        const kc = knowledgeCheck as Record<string, unknown>;
        content.quizQuestions = [{
          question: (kc.question as string) ?? '',
          options: (kc.options as string[]) ?? [],
          correctIndex: (kc.correctIndex as number) ?? 0,
          explanation: (kc.explanation as string) ?? '',
        }];
      } else {
        content.quizQuestions = null;
      }

      // Free: gate resources unless coin-unlocked
      if (!unlockedFeatures.has('resources')) {
        if (content.resources && content.resources.length > 1) {
          content.resources = content.resources.slice(0, 1);
        }
      }

      // Free: gate fun facts unless coin-unlocked
      if (!unlockedFeatures.has('fun_facts')) {
        content.funFacts = null;
      }

      // Free: gate code challenges unless coin-unlocked
      if (!unlockedFeatures.has('code_challenge')) {
        content.codeChallenge = null;
      }

      // Build locked features, excluding already-unlocked ones
      content.lockedFeatures = this.buildLockedFeatures(tier)
        .filter((lf) => !unlockedFeatures.has(lf.type));
    }

    return content;
  }

  private buildLockedFeatures(tier: string): LockedFeature[] {
    if (tier !== 'free') return [];

    return [
      {
        type: 'resources',
        teaser: 'Unlock curated learning resources for this topic',
        unlockMethod: 'coins',
        coinCost: 5,
        requiredTier: 'pro',
      },
      {
        type: 'fun_facts',
        teaser: 'Discover fascinating facts about this subject',
        unlockMethod: 'coins',
        coinCost: 3,
        requiredTier: 'pro',
      },
      {
        type: 'ai_tutor',
        teaser: 'Get personalized AI tutoring and explanations',
        unlockMethod: 'upgrade',
        coinCost: null,
        requiredTier: 'pro',
      },
      {
        type: 'code_challenge',
        teaser: 'Practice with interactive coding challenges',
        unlockMethod: 'coins',
        coinCost: 10,
        requiredTier: 'pro',
      },
    ];
  }

  private emptyPackage(
    taskId: string,
    status: QuestContentPackage['status'],
  ): QuestContentPackage {
    return {
      taskId,
      status,
      contentFormat: 'article',
      articleBody: null,
      quizQuestions: null,
      resources: null,
      funFacts: null,
      codeChallenge: null,
      aiHintsRemaining: 0,
      aiTutorAvailable: false,
      lockedFeatures: [],
    };
  }

  private extractSettled<T>(result: PromiseSettledResult<T | null>, label: string): T | null {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    this.logger.warn(`[${label}] Generator failed: ${result.reason?.message ?? result.reason}`);
    return null;
  }

  private mapBloomToDifficulty(bloom: string): 'easy' | 'medium' | 'hard' {
    switch (bloom) {
      case 'remember':
      case 'understand':
        return 'easy';
      case 'apply':
      case 'analyze':
        return 'medium';
      case 'evaluate':
      case 'create':
        return 'hard';
      default:
        return 'easy';
    }
  }

  private mapBloomToLevel(bloom: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (bloom) {
      case 'remember':
      case 'understand':
        return 'beginner';
      case 'apply':
      case 'analyze':
        return 'intermediate';
      case 'evaluate':
      case 'create':
        return 'advanced';
      default:
        return 'beginner';
    }
  }
}

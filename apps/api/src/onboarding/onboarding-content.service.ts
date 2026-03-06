import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService } from '../i18n/translation.service';
import { MilestoneSuggestionGenerator } from '../ai/generators/milestone-suggestion.generator';
import { OnboardingAssessmentGenerator } from '../ai/generators/onboarding-assessment.generator';
import { InterestSuggestionGenerator } from '../ai/generators/interest-suggestion.generator';
import type { OnboardingContext } from '@plan2skill/types';

// ═══════════════════════════════════════════
// ONBOARDING CONTENT SERVICE
// Serves onboarding reference data with i18n
// Warm cache on boot, join with TranslationService
// ═══════════════════════════════════════════

interface RefContentRow {
  id: string;
  entityType: string;
  entityId: string;
  parentId: string | null;
  data: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
}

@Injectable()
export class OnboardingContentService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingContentService.name);
  private cache = new Map<string, RefContentRow[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
    private readonly milestoneGenerator: MilestoneSuggestionGenerator,
    private readonly assessmentGenerator: OnboardingAssessmentGenerator,
    private readonly interestGenerator: InterestSuggestionGenerator,
  ) {}

  async onModuleInit() {
    await this.warmCache();
  }

  async warmCache() {
    const rows = await this.prisma.refContent.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    this.cache.clear();
    for (const row of rows) {
      const key = row.entityType;
      if (!this.cache.has(key)) {
        this.cache.set(key, []);
      }
      this.cache.get(key)!.push({
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        parentId: row.parentId,
        data: row.data as Record<string, unknown>,
        sortOrder: row.sortOrder,
        active: row.active,
      });
    }
    this.logger.log(
      `Cached ${rows.length} ref_content rows across ${this.cache.size} entity types`,
    );
  }

  private getRows(entityType: string): RefContentRow[] {
    return this.cache.get(entityType) ?? [];
  }

  private t(
    entityType: string,
    entityId: string,
    field: string,
    locale: string,
    fallback?: string,
  ): string {
    return this.translationService.get(entityType, entityId, field, locale, fallback);
  }

  // ─── Query Methods ───────────────────────────

  async getIntents(locale: string) {
    return this.getRows('intent').map((row) => ({
      id: row.entityId,
      title: this.t('intent', row.entityId, 'title', locale, row.entityId),
      description: this.t('intent', row.entityId, 'description', locale, ''),
      icon: row.data.icon as string,
      color: row.data.color as string,
      nextRoute: row.data.nextRoute as string,
    }));
  }

  async getDomains(locale: string) {
    const domains = this.getRows('domain');
    const interests = this.getRows('interest');

    return domains.map((d) => ({
      id: d.entityId,
      name: this.t('domain', d.entityId, 'name', locale, d.entityId),
      description: this.t('domain', d.entityId, 'description', locale, ''),
      icon: d.data.icon as string,
      color: d.data.color as string,
      interests: interests
        .filter((i) => i.parentId === d.entityId)
        .map((i) => ({
          id: i.entityId,
          label: this.t('interest', i.entityId, 'label', locale, i.entityId),
          domain: d.entityId,
          icon: i.data.icon as string,
          color: i.data.color as string,
          trending: (i.data.trending as boolean) ?? false,
        })),
    }));
  }

  async getCareerData(locale: string) {
    const painPoints = this.getRows('pain_point').map((row) => ({
      id: row.entityId,
      label: this.t('pain_point', row.entityId, 'label', locale, row.entityId),
      icon: row.data.icon as string,
      color: row.data.color as string,
    }));

    const careerTargets = this.getRows('career_target').map((row) => ({
      id: row.entityId,
      name: this.t('career_target', row.entityId, 'name', locale, row.entityId),
      description: this.t('career_target', row.entityId, 'description', locale, ''),
      icon: row.data.icon as string,
      color: row.data.color as string,
      suggestedDomain: row.data.suggestedDomain as string,
    }));

    return { painPoints, careerTargets };
  }

  async getArchetypes(locale: string) {
    return this.getRows('archetype').map((row) => ({
      id: row.entityId,
      name: this.t('archetype', row.entityId, 'name', locale, row.entityId),
      tagline: this.t('archetype', row.entityId, 'tagline', locale, ''),
      bestFor: this.t('archetype', row.entityId, 'bestFor', locale, ''),
      icon: row.data.icon as string,
      color: row.data.color as string,
      stats: row.data.stats as { label: string; value: number }[],
    }));
  }

  async getAssessmentQuestions(domain: string, locale: string) {
    const questions = this.getRows('assessment_question')
      .filter((row) => row.data.domain === domain);
    const options = this.getRows('assessment_option');

    return questions.map((row) => ({
      id: row.entityId,
      domain: row.data.domain as string,
      difficulty: (row.data.difficulty as 1 | 2 | 3) ?? 1,
      question: this.t('assessment_question', row.entityId, 'question', locale, row.data.question as string ?? ''),
      options: options
        .filter((o) => o.parentId === row.entityId)
        .map((o) => ({
          id: o.entityId,
          text: this.t('assessment_option', o.entityId, 'text', locale, o.data.text as string ?? ''),
          correct: (o.data.correct as boolean) ?? false,
        })),
      npcReaction: {
        correct: this.t('assessment_question', row.entityId, 'npcCorrect', locale, row.data.npcCorrect as string ?? 'Well done!'),
        wrong: this.t('assessment_question', row.entityId, 'npcWrong', locale, row.data.npcWrong as string ?? 'Not quite — keep learning!'),
        correctEmotion: (row.data.correctEmotion as string) ?? 'happy',
        wrongEmotion: (row.data.wrongEmotion as string) ?? 'thinking',
      },
    }));
  }

  // ─── Submit Methods ──────────────────────────

  async submitAssessment(
    userId: string,
    data: {
      assessments: Array<{
        domain: string;
        level: string;
        method: string;
        score: number;
        confidence: number;
      }>;
    },
  ) {
    await this.prisma.onboardingSubmission.upsert({
      where: { userId },
      update: {
        assessments: data.assessments as any,
        updatedAt: new Date(),
      },
      create: {
        userId,
        assessments: data.assessments as any,
      },
    });
    return { success: true };
  }

  async submitGoal(
    userId: string,
    data: {
      intent: string;
      path: string;
      dreamGoal?: string;
      domain?: string;
      interests?: string[];
      careerTarget?: string;
      pains?: string[];
      milestones?: Array<{ id: string; text: string }>;
      locale?: string;
      skillLevel?: string;
      customGoals?: string[];
    },
  ) {
    await this.prisma.onboardingSubmission.upsert({
      where: { userId },
      update: {
        intent: data.intent,
        path: data.path,
        dreamGoal: data.dreamGoal,
        domain: data.domain,
        interests: data.interests as any,
        careerTarget: data.careerTarget,
        pains: data.pains as any,
        milestones: data.milestones as any,
        locale: data.locale ?? 'en',
        updatedAt: new Date(),
      },
      create: {
        userId,
        intent: data.intent,
        path: data.path,
        dreamGoal: data.dreamGoal,
        domain: data.domain,
        interests: data.interests as any,
        careerTarget: data.careerTarget,
        pains: data.pains as any,
        milestones: data.milestones as any,
        locale: data.locale ?? 'en',
      },
    });
    return { success: true };
  }

  // ─── AI Milestone Suggestions ──────────────

  async suggestMilestones(userId: string, context: OnboardingContext) {
    const result = await this.milestoneGenerator.generate(userId, context);
    return result.milestones;
  }

  // ─── AI Assessment Questions ────────────────

  async generateAssessmentQuestions(userId: string, context: OnboardingContext) {
    const result = await this.assessmentGenerator.generate(userId, context);
    return result.questions;
  }

  // ─── AI Interest Suggestions ────────────────

  async suggestInterests(userId: string, data: { domain: string; dreamGoal: string; locale: string }) {
    const result = await this.interestGenerator.generate(userId, data);
    return result.interests;
  }
}

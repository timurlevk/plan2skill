import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ILlmClient } from './interfaces';
import { LLM_CLIENT_TOKEN } from './interfaces';
import { LlmTracer } from './llm-tracer';
import { AiRateLimitService } from './rate-limit.service';
import { ModelTier } from './types';
import { z } from 'zod';

/**
 * Insight Generator — background service that analyzes user performance
 * data (TaskAttempts + QuestCompletions) and generates LearnerInsight rows.
 *
 * Triggered non-blocking from progression.service after N completions.
 * Uses BUDGET tier LLM to keep costs minimal.
 */

const INSIGHT_VALID_DAYS = 14; // insights expire after 2 weeks
const MIN_COMPLETIONS_FOR_ANALYSIS = 5; // minimum data points needed

@Injectable()
export class InsightGeneratorService {
  private readonly logger = new Logger(InsightGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_CLIENT_TOKEN) private readonly llmClient: ILlmClient,
    private readonly rateLimitService: AiRateLimitService,
    private readonly tracer: LlmTracer,
  ) {}

  /**
   * Analyze recent user performance and generate insights.
   * Non-blocking — called fire-and-forget from progression service.
   */
  async generateInsights(userId: string): Promise<void> {
    try {
      // Gather recent data
      const [recentCompletions, recentAttempts] = await Promise.all([
        this.prisma.questCompletion.findMany({
          where: {
            userId,
            completedAt: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 30,
          select: {
            questType: true,
            qualityScore: true,
            timeSpentSeconds: true,
            task: {
              select: {
                skillDomain: true,
                difficultyTier: true,
                bloomLevel: true,
                taskType: true,
              },
            },
          },
        }),
        this.prisma.taskAttempt.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            correct: true,
            selectedIndex: true,
            timeSpentSeconds: true,
            hintsRequested: true,
            task: {
              select: {
                skillDomain: true,
                bloomLevel: true,
                knowledgeCheck: true,
              },
            },
          },
        }),
      ]);

      if (recentCompletions.length < MIN_COMPLETIONS_FOR_ANALYSIS) {
        this.logger.debug(
          `Not enough data for insights (${recentCompletions.length} completions), skipping`,
        );
        return;
      }

      // Build analysis summary for LLM
      const wrongAttempts = recentAttempts.filter((a) => a.correct === false);
      const domains = [...new Set(recentCompletions.map((c) => c.task.skillDomain).filter(Boolean))];
      const avgQuality =
        recentCompletions.reduce((sum, c) => sum + (c.qualityScore ?? 0), 0) /
        recentCompletions.length;

      const analysisSummary = JSON.stringify({
        totalCompletions: recentCompletions.length,
        totalAttempts: recentAttempts.length,
        wrongAttempts: wrongAttempts.length,
        averageQuality: avgQuality.toFixed(2),
        domains,
        wrongAnswersByDomain: this.groupByDomain(wrongAttempts),
        hintsRequestedTotal: recentAttempts.reduce(
          (sum, a) => sum + a.hintsRequested,
          0,
        ),
      });

      // Rate limit check — look up subscription tier
      const progression = await this.prisma.userProgression.findUnique({
        where: { userId },
        select: { subscriptionTier: true },
      });
      await this.rateLimitService.check(userId, progression?.subscriptionTier ?? 'free');

      // Call BUDGET tier LLM for analysis
      const systemPrompt = `You are a learning analytics engine. Analyze learner performance data and identify patterns.

Output valid JSON only:
{
  "insights": [
    {
      "insightType": "error_pattern | misconception | learning_velocity | summary",
      "skillDomain": "string | null",
      "title": "string (max 200 chars)",
      "description": "string — detailed explanation",
      "confidence": number (0.0-1.0)
    }
  ]
}

Rules:
- Generate 1-5 insights based on available data
- error_pattern: recurring mistakes in specific topics
- misconception: detected conceptual misunderstandings
- learning_velocity: how fast the learner progresses vs expected
- summary: overall performance summary
- Higher confidence for patterns seen in 3+ instances
- Be specific — "confuses map() and filter()" not "needs more practice"`;
      const userPrompt = `Analyze this learner's recent performance data:\n${analysisSummary}\n\nReturn ONLY the JSON.`;

      let response;
      try {
        response = await this.llmClient.call({
          tier: ModelTier.BUDGET,
          systemPrompt,
          userPrompt,
          maxTokens: 1024,
          temperature: 0.3,
          generatorType: 'insight-generator',
        });

        this.tracer.trackSuccess({
          userId,
          generatorType: 'insight-generator',
          model: response.model,
          purpose: 'insight-generation',
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          durationMs: response.durationMs,
          attempt: response.attempt,
          cacheHit: false,
          systemPrompt,
          userPrompt,
          responseText: response.text,
        });
      } catch (llmErr) {
        this.tracer.trackFailure({
          userId,
          generatorType: 'insight-generator',
          model: 'unknown',
          purpose: 'insight-generation',
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
          attempt: 1,
          errorMessage: llmErr instanceof Error ? llmErr.message : String(llmErr),
          systemPrompt,
          userPrompt,
        });
        throw llmErr;
      }

      // Parse + Zod validate response
      let raw: unknown;
      try {
        raw = JSON.parse(response.text);
      } catch {
        this.logger.warn('Failed to parse insight LLM response');
        return;
      }

      const result = InsightResponseSchema.safeParse(raw);
      if (!result.success) {
        this.logger.warn(`Insight Zod validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`);
        return;
      }

      const { insights } = result.data;
      if (insights.length === 0) return;

      const validUntil = new Date(
        Date.now() + INSIGHT_VALID_DAYS * 24 * 60 * 60 * 1000,
      );

      // Supersede old insights of the same types by expiring them
      const newTypes = insights.map((i) => i.insightType);
      await this.prisma.learnerInsight.updateMany({
        where: {
          userId,
          validUntil: { gt: new Date() },
          insightType: { in: newTypes },
          generatedBy: 'insight-generator',
        },
        data: { validUntil: new Date() },
      });

      // Batch-create new insights
      await this.prisma.learnerInsight.createMany({
        data: insights.slice(0, 5).map((insight) => ({
          userId,
          insightType: insight.insightType,
          skillDomain: insight.skillDomain ?? null,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          generatedBy: 'insight-generator',
          validUntil,
        })),
      });

      this.logger.log(
        `Generated ${insights.length} insights for user ${userId}`,
      );
    } catch (err) {
      this.logger.warn(
        `Insight generation failed for ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private groupByDomain(
    attempts: Array<{
      task: { skillDomain: string | null };
    }>,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const a of attempts) {
      const domain = a.task.skillDomain ?? 'unknown';
      counts[domain] = (counts[domain] ?? 0) + 1;
    }
    return counts;
  }
}

// ─── Zod schema for LLM insight output validation ────────────────
const InsightResponseSchema = z.object({
  insights: z.array(
    z.object({
      insightType: z.enum(['error_pattern', 'misconception', 'learning_velocity', 'summary']),
      skillDomain: z.string().max(50).nullable(),
      title: z.string().max(200),
      description: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

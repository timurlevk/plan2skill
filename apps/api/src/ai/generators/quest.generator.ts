import { Inject, Injectable } from '@nestjs/common';
import { BaseGenerator } from '../core/base-generator';
import { ModelTier } from '../core/types';
import type { GeneratorContext } from '../core/types';
import type { ILlmClient } from '../core/interfaces';
import { LLM_CLIENT_TOKEN } from '../core/interfaces';
import { LlmTracer } from '../core/llm-tracer';
import { CacheService } from '../core/cache.service';
import { ContextEnrichmentService } from '../core/context-enrichment.service';
import { ContentSafetyService } from '../core/content-safety.service';
import { AiQuestBatchSchema, type AiQuestBatch } from '../schemas/quest.schema';
import { createHash } from 'crypto';

export interface QuestGeneratorInput {
  skillDomain: string;
  milestoneId: string;
  count: number;
  dailyMinutes: number;
  existingTaskTitles: string[];
}

@Injectable()
export class QuestGenerator extends BaseGenerator<
  QuestGeneratorInput,
  AiQuestBatch
> {
  protected readonly generatorType = 'quest';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.6;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = AiQuestBatchSchema;
  protected readonly cacheTtlSeconds = 3600;

  constructor(
    @Inject(LLM_CLIENT_TOKEN) llmClient: ILlmClient,
    tracer: LlmTracer,
    cacheService: CacheService,
    contextService: ContextEnrichmentService,
    safetyService: ContentSafetyService,
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService);
  }

  protected getCacheKey(input: QuestGeneratorInput, context: GeneratorContext): string {
    const date = new Date().toISOString().slice(0, 10);
    const hash = createHash('sha256')
      .update(`${context.userProfile.userId}:${input.skillDomain}:${date}`)
      .digest('hex')
      .slice(0, 16);
    return `quest:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    let prompt = `You are Plan2Skill's quest generation engine. You create personalized learning quests.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "quests": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "taskType": "video|article|quiz|project|review|boss",
      "questType": "knowledge|physical|creative|habit|social|reflection",
      "estimatedMinutes": number (5-120),
      "xpReward": number (10-500),
      "coinReward": number (1-50),
      "rarity": "common|uncommon|rare|epic|legendary",
      "skillDomain": "string (1-50 chars)",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "flowCategory": "stretch|mastery|review",
      "difficultyTier": number (1-5),
      "knowledgeCheck": {
        "question": "string (10-500 chars)",
        "options": ["4 strings, each 1-200 chars"],
        "correctIndex": number (0-3),
        "explanation": "string (10-500 chars)"
      }
    }
  ]
}

**Rules:**
- Flow state distribution: 70% mastery, 20% stretch, 10% review
- Bloom's level should match user's skill proficiency
- Rarity: ~50% common, 25% uncommon, 15% rare, 8% epic, 2% legendary
- XP: common 15-25, uncommon 30-50, rare 60-100, epic 120-200, legendary 250-500
- Every quest MUST include a knowledgeCheck for validation
- Questions should have exactly 4 options with exactly 1 correct answer
- Distractors should be plausible (common misconceptions, partial knowledge)`;

    prompt += `\n\n**User Context:**`;
    prompt += `\n- Level: ${context.userProfile.level}`;

    if (context.learningContext) {
      prompt += `\n- Current streak: ${context.learningContext.currentStreak} days`;
      prompt += `\n- Average quality: ${(context.learningContext.averageQualityScore * 100).toFixed(0)}%`;
      if (context.learningContext.skillElos.length > 0) {
        const eloStr = context.learningContext.skillElos
          .slice(0, 5)
          .map((e) => `${e.skillDomain}(${e.elo})`)
          .join(', ');
        prompt += `\n- Skill Elo: ${eloStr}`;
      }
    }

    if (context.performanceContext) {
      const perf = context.performanceContext;
      if (perf.preferredTaskTypes.length > 0) {
        prompt += `\n- Preferred types: ${perf.preferredTaskTypes.join(', ')}`;
      }
      prompt += `\n- Avg time ratio: ${perf.averageTimeSpentRatio.toFixed(2)} (>1 = takes longer than estimated)`;
    }

    return prompt;
  }

  protected buildUserPrompt(
    input: QuestGeneratorInput,
    context: GeneratorContext,
  ): string {
    let prompt = `Generate ${input.count} learning quests for the skill domain "${input.skillDomain}".

**Constraints:**
- Daily time budget: ${input.dailyMinutes} minutes
- Total quest time should not exceed ${input.dailyMinutes} minutes`;

    if (input.existingTaskTitles.length > 0) {
      prompt += `\n\n**Avoid repetition — existing tasks:**`;
      for (const title of input.existingTaskTitles.slice(0, 10)) {
        prompt += `\n- ${title}`;
      }
    }

    if (context.learningContext?.skillElos.length) {
      const domainElo = context.learningContext.skillElos.find(
        (e) => e.skillDomain === input.skillDomain,
      );
      if (domainElo) {
        const tier = domainElo.elo < 1000 ? 'beginner' :
          domainElo.elo < 1300 ? 'intermediate' :
          domainElo.elo < 1600 ? 'advanced' : 'expert';
        prompt += `\n\n**Skill proficiency:** ${input.skillDomain} Elo ${domainElo.elo} (${tier})`;
        prompt += `\nAdjust Bloom's level and difficulty accordingly.`;
      }
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

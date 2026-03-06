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
import { AiRateLimitService } from '../core/rate-limit.service';
import { TemplateService } from '../core/template.service';
import { AiMotivationalSchema, type AiMotivationalResult } from '../schemas/motivational.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';

export interface MotivationalGeneratorInput {
  triggerType: 'streak_milestone' | 'level_up' | 'comeback' | 'daily_start' | 'quest_complete';
  streakDays?: number;
  level?: number;
  characterId?: string;
}

@Injectable()
export class MotivationalGenerator extends BaseGenerator<
  MotivationalGeneratorInput,
  AiMotivationalResult
> {
  protected readonly generatorType = 'motivational';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.7;
  protected readonly maxTokens = 512;
  protected readonly outputSchema = AiMotivationalSchema;
  protected readonly cacheTtlSeconds = 3600;

  constructor(
    @Inject(LLM_CLIENT_TOKEN) llmClient: ILlmClient,
    tracer: LlmTracer,
    cacheService: CacheService,
    contextService: ContextEnrichmentService,
    safetyService: ContentSafetyService,
    rateLimitService: AiRateLimitService,
    templateService: TemplateService,
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService, rateLimitService, templateService);
  }

  protected getCacheKey(input: MotivationalGeneratorInput): string {
    const approxKey = `${input.triggerType}:${input.level ?? 0}:${input.streakDays ?? 0}`;
    const hash = createHash('sha256')
      .update(approxKey)
      .digest('hex')
      .slice(0, 16);
    return `motivational:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile, domainModel } = context;

    let prompt = `You are Plan2Skill's motivational companion. You craft short, punchy, and inspiring messages for learners at key moments in their journey.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "message": "string (5-500 chars) — the motivational message",
  "tone": "encouraging|celebratory|epic|gentle",
  "emoji": "string (optional, max 10 chars) — a fitting emoji"
}

**Rules:**
- Messages must be 1-3 sentences — short and punchy
- Match tone to the trigger:
  - streak_milestone: celebratory or epic, acknowledge the achievement
  - level_up: celebratory, highlight growth and new capabilities
  - comeback: gentle or encouraging, welcome back without guilt
  - daily_start: encouraging, energize for the day ahead
  - quest_complete: celebratory or epic, reward the effort
- Use RPG/gaming metaphors when appropriate (the platform is gamified)
- Be genuine — avoid generic platitudes
- If a character context is available, reference the character's journey
- Emoji should complement the tone (optional field)`;

    // L0: Archetype motivational style
    if (domainModel.archetypeBlueprint) {
      prompt += `\n\n**Motivational Style:** ${domainModel.archetypeBlueprint.motivationalStyle}`;
      prompt += `\nAdapt your tone to match this style.`;
    }

    // L1: Character context
    if (learnerProfile.characterAttributes && learnerProfile.characterId) {
      prompt += `\n\n**Character Context:**`;
      prompt += `\n- Character: ${learnerProfile.characterId}`;
      prompt += `\n- Archetype: ${learnerProfile.archetypeId ?? 'unknown'}`;
      prompt += `\n- Evolution tier: ${learnerProfile.evolutionTier ?? 'base'}`;
    }

    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: MotivationalGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Generate a motivational message for trigger: "${input.triggerType}".`;

    if (input.streakDays !== undefined) {
      prompt += `\n- Streak days: ${input.streakDays}`;
    }
    if (input.level !== undefined) {
      prompt += `\n- Current level: ${input.level}`;
    }
    if (input.characterId) {
      prompt += `\n- Character ID: ${input.characterId}`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

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
import { AiQuizSchema, type AiQuizResult } from '../schemas/quiz.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';

export interface QuizGeneratorInput {
  skillDomain: string;
  bloomLevel: string;
  questionCount: number;
  context?: string;
}

@Injectable()
export class QuizGenerator extends BaseGenerator<
  QuizGeneratorInput,
  AiQuizResult
> {
  protected readonly generatorType = 'quiz';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.3;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = AiQuizSchema;
  protected readonly cacheTtlSeconds = 86400;

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

  protected getCacheKey(input: QuizGeneratorInput): string {
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.bloomLevel}:${input.questionCount}`)
      .digest('hex')
      .slice(0, 16);
    return `quiz:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile } = context;

    let prompt = `You are Plan2Skill's expert quiz designer. You generate high-quality quiz questions targeting specific Bloom's taxonomy levels.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "questions": [
    {
      "question": "string (10-500 chars)",
      "options": ["4 strings, each 1-300 chars"],
      "correctIndex": number (0-3),
      "explanation": "string (10-500 chars)",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "distractorTypes": ["1-4 types from: plausible-wrong, common-misconception, partial-truth, off-topic"]
    }
  ]
}

**Rules:**
- Exactly 4 options per question, exactly 1 correct answer
- correctIndex must be 0, 1, 2, or 3
- Each distractor (wrong answer) must be tagged with its type:
  - plausible-wrong: sounds reasonable but is factually incorrect
  - common-misconception: a widely held but incorrect belief
  - partial-truth: partially correct but missing key details
  - off-topic: unrelated or irrelevant to the question
- Mix distractor types across questions for variety
- Questions should be practical and scenario-based, not trivial recall
- Bloom's level must match the requested target level
- Explanations should teach — explain WHY the correct answer is right and why key distractors are wrong`;

    // L1: User context
    prompt += `\n\n**User Context:**`;
    prompt += `\n- Level: ${learnerProfile.level}`;

    if (learnerProfile.skillElos.length) {
      const eloStr = learnerProfile.skillElos
        .slice(0, 5)
        .map((e) => `${e.skillDomain}(${e.elo})`)
        .join(', ');
      prompt += `\n- Existing proficiency: ${eloStr}`;
    }

    // L2: Roadmap milestone context for topic targeting
    if (context.roadmapContext) {
      const activeMilestone = context.roadmapContext.milestones.find(
        (m) => m.status === 'active' || m.status === 'in_progress',
      );
      if (activeMilestone?.skillDomains.length) {
        prompt += `\n- Active milestone topics: ${activeMilestone.skillDomains.join(', ')}`;
      }
    }

    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: QuizGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Generate ${input.questionCount} quiz questions for skill domain "${input.skillDomain}".

**Parameters:**
- Target Bloom's level: ${input.bloomLevel}
- Question count: ${input.questionCount}`;

    if (input.context) {
      prompt += `\n- Additional context: ${input.context}`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

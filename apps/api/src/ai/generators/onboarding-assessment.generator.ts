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
import { buildLocaleInstruction } from '../core/locale-utils';
import {
  OnboardingAssessmentOutputSchema,
  type OnboardingAssessmentOutput,
} from '../schemas/onboarding-assessment.schema';
import type { OnboardingContext } from '@plan2skill/types';

// ─── Generator ──────────────────────────────────────────────

@Injectable()
export class OnboardingAssessmentGenerator extends BaseGenerator<
  OnboardingContext,
  OnboardingAssessmentOutput
> {
  protected readonly generatorType = 'onboarding-assessment';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.5;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = OnboardingAssessmentOutputSchema;

  protected readonly cacheTtlSeconds = 86400; // 24h

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

  // ─── Cache Key — path-aware ───────────────────────────────

  protected getCacheKey(input: OnboardingContext): string | null {
    const goal = input.dreamGoal.trim().toLowerCase().slice(0, 100);

    switch (input.path) {
      case 'direct':
        return `onb-assess:${input.locale}:direct:${goal}`;

      case 'guided': {
        const domain = input.selectedDomain.toLowerCase();
        const interests = input.selectedInterests.slice().sort().join(',').toLowerCase().slice(0, 100);
        const level = input.skillLevel ?? 'any';
        return `onb-assess:${input.locale}:guided:${domain}:${interests}:${level}:${goal}`;
      }

      case 'career': {
        const current = input.careerCurrent.trim().toLowerCase().slice(0, 50);
        const target = (input.careerTarget ?? 'none').toLowerCase();
        return `onb-assess:${input.locale}:career:${current}:${target}:${goal}`;
      }
    }
  }

  // ─── System Prompt ────────────────────────────────────────

  protected buildSystemPrompt(context: GeneratorContext): string {
    let prompt = `You are Plan2Skill's assessment quiz generator. Given a learner's context, generate exactly 5 multiple-choice questions to evaluate their current knowledge level.

Your output must be valid JSON. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "questions": [
    {
      "id": "string — kebab-case unique id (e.g. 'react-state-hooks')",
      "domain": "string — the skill domain being assessed",
      "difficulty": 1 | 2 | 3,
      "question": "string — the question text (10-500 chars)",
      "options": [
        { "id": "a" | "b" | "c" | "d", "text": "string — option text", "correct": boolean }
      ],
      "npcReaction": {
        "correct": "string — mentor reaction when answer is correct",
        "wrong": "string — mentor reaction when answer is wrong (briefly explain the right answer)",
        "correctEmotion": "neutral" | "happy" | "impressed" | "thinking",
        "wrongEmotion": "neutral" | "happy" | "impressed" | "thinking"
      }
    }
  ]
}

**Rules:**
- Generate exactly 5 questions
- Difficulty distribution: 2× difficulty 1 (easy), 2× difficulty 2 (medium), 1× difficulty 3 (hard)
- Each question has exactly 4 options (a, b, c, d), exactly 1 correct
- Randomize the position of the correct answer across questions (don't always put it as option "a")
- Wrong answers must be plausible — common misconceptions, partial truths, or similar-sounding concepts
- All questions must have the same domain value
- Generate unique kebab-case IDs for each question
- NPC reactions use an RPG mentor tone — encouraging, brief
- The "wrong" reaction should briefly hint at or explain the correct answer
- correctEmotion: use "happy" for easy, "impressed" for hard, "thinking" for medium
- wrongEmotion: use "thinking" for most, "neutral" for easy`;

    prompt += buildLocaleInstruction(context.learnerProfile.locale);
    return prompt;
  }

  // ─── User Prompt — path-specific injection ────────────────

  protected buildUserPrompt(input: OnboardingContext, _context: GeneratorContext): string {
    let prompt = `Generate 5 assessment questions for this learner:\n`;

    prompt += `\n**Path:** ${input.path}`;
    prompt += `\n**Dream goal:** "${input.dreamGoal}"`;

    switch (input.path) {
      case 'direct':
        prompt += `\n\nThe learner stated a specific goal. Infer the most relevant skill domain from the goal and generate questions about that domain. Set the "domain" field to the inferred domain (use a short kebab-case id like "tech", "design", "data-science", "languages", etc.).`;
        break;

      case 'guided':
        prompt += `\n**Domain:** ${input.selectedDomain}`;
        if (input.selectedInterests.length > 0) {
          prompt += `\n**Interests:** ${input.selectedInterests.join(', ')}`;
        }
        if (input.customInterests.length > 0) {
          prompt += `\n**Custom interests:** ${input.customInterests.join(', ')}`;
        }
        if (input.skillLevel) {
          prompt += `\n**Self-reported skill level:** ${input.skillLevel}`;
        }
        prompt += `\n\nGenerate questions targeted at the domain and interests. Use domain "${input.selectedDomain}" as the "domain" field value for all questions.`;
        if (input.skillLevel === 'advanced') {
          prompt += ` Since the learner self-reports as advanced, make questions more nuanced — test edge cases and deeper understanding.`;
        }
        break;

      case 'career':
        prompt += `\n**Current role:** ${input.careerCurrent}`;
        if (input.careerPains.length > 0) {
          prompt += `\n**Pain points:** ${input.careerPains.join(', ')}`;
        }
        if (input.careerTarget) {
          prompt += `\n**Target career:** ${input.careerTarget}`;
        }
        prompt += `\n\nGenerate questions about the skills gap between the current role and target career. Focus on skills needed for the transition. Use the target career's primary skill domain as the "domain" field.`;
        break;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;
    return prompt;
  }
}

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
  MilestoneSuggestionSchema,
  type MilestoneSuggestionResult,
} from '../schemas/milestone-suggestion.schema';
import type { OnboardingContext } from '@plan2skill/types';

// ─── Generator ──────────────────────────────────────────────────

@Injectable()
export class MilestoneSuggestionGenerator extends BaseGenerator<
  OnboardingContext,
  MilestoneSuggestionResult
> {
  protected readonly generatorType = 'milestone-suggestion';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.6;
  protected readonly maxTokens = 768;
  protected readonly outputSchema = MilestoneSuggestionSchema;

  protected readonly cacheTtlSeconds = 600; // 10 min

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

  // ─── Cache Key — path-aware, human-readable ─────────────────

  protected getCacheKey(input: OnboardingContext): string | null {
    const goal = input.dreamGoal.trim().toLowerCase().slice(0, 100);

    switch (input.path) {
      case 'direct':
        return `ms-suggest:${input.locale}:direct:${goal}`;

      case 'guided': {
        const domain = input.selectedDomain.toLowerCase();
        const interests = input.selectedInterests.slice().sort().join(',').toLowerCase().slice(0, 100);
        const level = input.skillLevel ?? 'any';
        const customs = input.customGoals.length
          ? input.customGoals.slice().sort().join('|').toLowerCase().slice(0, 150)
          : '';
        return `ms-suggest:${input.locale}:guided:${goal}:${domain}:${interests}:${level}:${customs}`;
      }

      case 'career': {
        const current = input.careerCurrent.trim().toLowerCase().slice(0, 50);
        const pains = input.careerPains.slice().sort().join(',').toLowerCase();
        const target = (input.careerTarget ?? 'none').toLowerCase();
        return `ms-suggest:${input.locale}:career:${goal}:${current}:${pains}:${target}`;
      }
    }
  }

  // ─── System Prompt — base rules + path-specific guidance ────

  protected buildSystemPrompt(context: GeneratorContext): string {
    let prompt = `You are Plan2Skill's onboarding assistant. Given a learner's dream goal and context, suggest 3-6 progressive milestones that form a learning path.

Your output must be valid JSON. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "milestones": [
    {
      "id": "string — kebab-case unique id (e.g. 'html-basics')",
      "text": "string — milestone title (3-200 chars, concise & actionable)",
      "weeks": number — estimated weeks to complete (1-26)
    }
  ]
}

**Rules:**
- Suggest 3-6 milestones that build on each other progressively
- Total weeks should sum to roughly 12-24 weeks (3-6 months)
- Milestones should be specific, measurable, and achievable
- Each milestone title should start with an action verb or describe a concrete skill level
- Generate unique kebab-case IDs (e.g. "js-fundamentals", "react-components")

**Skill-level adaptation:**
- beginner: Start from fundamentals, first milestone should cover core basics
- familiar: Skip pure basics, start from practical application of known concepts
- intermediate: Focus on applied skills, project-based milestones, filling knowledge gaps
- advanced: Target mastery-level and teaching-level milestones, advanced techniques
- If no skill level is provided, assume beginner-friendly progression

**Custom goals handling:**
- If the learner provides custom goals, incorporate them into the path at appropriate points
- Reorder custom goals logically if needed (by prerequisite dependencies)
- Fill gaps between custom goals with additional milestones
- Custom goals should be reflected in the output, but you may rephrase them for clarity`;

    prompt += buildLocaleInstruction(context.learnerProfile.locale);
    return prompt;
  }

  // ─── User Prompt — inject all available context per path ────

  protected buildUserPrompt(input: OnboardingContext, _context: GeneratorContext): string {
    let prompt = `Suggest learning milestones for this learner:\n`;

    prompt += `\n**Path:** ${input.path}`;
    prompt += `\n**Dream goal:** "${input.dreamGoal}"`;

    switch (input.path) {
      case 'direct':
        // Direct path — goal is the only context, keep prompt lean
        prompt += `\n\nThe learner stated a specific goal — focus milestones directly on achieving it.`;
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
          prompt += `\n**Skill level:** ${input.skillLevel}`;
        }
        if (input.assessments.length > 0) {
          prompt += `\n**Assessments:**`;
          for (const a of input.assessments) {
            prompt += `\n- ${a.domain}: ${a.level} (${a.method}, ${Math.round(a.score)}%)`;
          }
        }
        if (input.customGoals.length > 0) {
          prompt += `\n**Custom milestones:**`;
          input.customGoals.forEach((goal, i) => {
            prompt += `\n${i + 1}. ${goal}`;
          });
        }
        prompt += `\n\nTailor milestones to the domain and interests. Incorporate custom goals at appropriate points. Reorder by prerequisites, fill gaps.`;
        break;

      case 'career':
        prompt += `\n**Current role:** ${input.careerCurrent}`;
        if (input.careerPains.length > 0) {
          prompt += `\n**Pain points:** ${input.careerPains.join(', ')}`;
        }
        if (input.careerTarget) {
          prompt += `\n**Target career:** ${input.careerTarget}`;
        }
        prompt += `\n\nBridge from current role to target career. Address pain points. Include portfolio/project milestones. Leverage transferable skills.`;
        break;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;
    return prompt;
  }
}

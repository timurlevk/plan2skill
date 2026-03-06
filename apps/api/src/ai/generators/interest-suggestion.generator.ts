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
  InterestSuggestionOutputSchema,
  type InterestSuggestionOutput,
} from '../schemas/interest-suggestion.schema';

// ─── Input ──────────────────────────────────────────────────────

export interface InterestSuggestionInput {
  domain: string;
  dreamGoal: string;
  locale: string;
}

// ─── Generator ──────────────────────────────────────────────────

@Injectable()
export class InterestSuggestionGenerator extends BaseGenerator<
  InterestSuggestionInput,
  InterestSuggestionOutput
> {
  protected readonly generatorType = 'interest-suggestion';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.7;
  protected readonly maxTokens = 512;
  protected readonly outputSchema = InterestSuggestionOutputSchema;

  protected readonly cacheTtlSeconds = 3600; // 1h

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

  protected getCacheKey(input: InterestSuggestionInput): string | null {
    const domain = input.domain.trim().toLowerCase().slice(0, 50);
    const goal = input.dreamGoal.trim().toLowerCase().slice(0, 50);
    return `int-suggest:${input.locale}:${domain}:${goal}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    let prompt = `You are Plan2Skill's interest discovery assistant. Given a learning domain (and optionally a dream goal), suggest 6-10 specific learning interests/topics within that domain.

Your output must be valid JSON. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "interests": [
    {
      "id": "string — kebab-case unique id (e.g. 'machine-learning', 'react-hooks')",
      "label": "string — human-readable label (2-100 chars, Title Case)"
    }
  ]
}

**Rules:**
- Suggest 6-10 interests that are specific sub-topics of the given domain
- Each interest should be concrete enough to build a learning path around
- Use kebab-case IDs derived from the label (e.g. "Machine Learning" → "machine-learning")
- Labels should be concise but descriptive (2-5 words typically)
- Mix foundational topics with trending/advanced ones
- Avoid overlapping or synonymous interests
- Order from more foundational to more advanced`;

    prompt += buildLocaleInstruction(context.learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(input: InterestSuggestionInput, _context: GeneratorContext): string {
    let prompt = `Suggest learning interests for this domain:\n`;
    prompt += `\n**Domain:** ${input.domain}`;
    if (input.dreamGoal) {
      prompt += `\n**Dream goal:** "${input.dreamGoal}"`;
    }
    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;
    return prompt;
  }
}

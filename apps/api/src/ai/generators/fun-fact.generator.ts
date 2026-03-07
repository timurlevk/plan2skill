import { Inject, Injectable, Optional } from '@nestjs/common';
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
import { PromptTemplateService } from '../core/prompt-template.service';
import { AiFunFactSchema, type AiFunFactResult } from '../schemas/fun-fact.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';
import { jsonInstructionHeader, jsonFooter } from '../core/prompt-builder';

export interface FunFactGeneratorInput {
  skillDomain: string;
  topic?: string;
}

@Injectable()
export class FunFactGenerator extends BaseGenerator<
  FunFactGeneratorInput,
  AiFunFactResult
> {
  protected readonly generatorType = 'fun-fact';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.8;
  protected readonly maxTokens = 512;
  protected readonly outputSchema = AiFunFactSchema;
  protected readonly cacheTtlSeconds = 86400;

  constructor(
    @Inject(LLM_CLIENT_TOKEN) llmClient: ILlmClient,
    tracer: LlmTracer,
    cacheService: CacheService,
    contextService: ContextEnrichmentService,
    safetyService: ContentSafetyService,
    rateLimitService: AiRateLimitService,
    templateService: TemplateService,
    @Optional() promptTemplateService?: PromptTemplateService,
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService, rateLimitService, templateService, promptTemplateService);
  }

  protected getCacheKey(input: FunFactGeneratorInput): string {
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.topic ?? ''}`)
      .digest('hex')
      .slice(0, 16);
    return `fun-fact:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    let prompt = `You are Plan2Skill's engaging micro-content creator. You generate fun, surprising, and educational facts about technical domains to keep learners curious and motivated.

${jsonInstructionHeader()}

**Output JSON schema:**
{
  "facts": [
    {
      "fact": "string (10-500 chars) — the fun fact",
      "category": "history|science|industry|surprising",
      "source": "string (optional, max 200 chars) — attribution or reference"
    }
  ]
}

**Rules:**
- Generate 3-5 facts per call
- Each fact should be genuinely interesting and accurate
- Categories:
  - history: historical origins, evolution of the technology/skill
  - science: underlying scientific principles or research
  - industry: real-world applications, company stories, market impact
  - surprising: counter-intuitive facts, unusual connections, "did you know" style
- Mix categories for variety
- Keep facts concise — 1-3 sentences each
- Provide source/attribution when the fact references specific studies or events
- Facts must be educational — the learner should gain insight, not just trivia`;

    prompt += buildLocaleInstruction(context.learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: FunFactGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Generate fun educational facts about "${input.skillDomain}".`;

    if (input.topic) {
      prompt += `\n- Focus on the specific topic: ${input.topic}`;
    }

    prompt += `\n\n${jsonFooter()}`;

    return prompt;
  }
}

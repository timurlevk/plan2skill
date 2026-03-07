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
import {
  DomainClassificationSchema,
  type DomainClassificationResult,
} from '../schemas/domain-classification.schema';
import { DOMAIN_CATEGORIES } from '../core/domain-capability';
import { jsonInstructionHeader, jsonFooter } from '../core/prompt-builder';

export interface DomainClassifierInput {
  goal: string;
  title: string;
}

@Injectable()
export class DomainClassifierService extends BaseGenerator<
  DomainClassifierInput,
  DomainClassificationResult
> {
  protected readonly generatorType = 'domain-classifier';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.2;
  protected readonly maxTokens = 512;
  protected readonly outputSchema = DomainClassificationSchema;
  protected readonly cacheTtlSeconds = 0; // result stored in DB, no ephemeral cache

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

  protected buildSystemPrompt(_context: GeneratorContext): string {
    // Domain classification is language-agnostic — no locale instruction
    return `You are a domain classifier for an EdTech platform. Given a learning goal and roadmap title, classify the domain into one or more categories.

${jsonInstructionHeader()}

**Domain categories** (pick 1-4):
${DOMAIN_CATEGORIES.map((c) => `- ${c}`).join('\n')}

**Output JSON schema:**
{
  "categories": ["primary_category", "secondary_category"],
  "primaryCategory": "primary_category",
  "hasCodingComponent": boolean,
  "hasPhysicalComponent": boolean,
  "hasCreativeComponent": boolean,
  "primaryLanguage": string | null,
  "suggestedTooling": ["tool1", "tool2"]
}

**Rules:**
- primaryCategory must be the first element of categories
- hasCodingComponent = true only if the domain involves writing code (programming, scripting, data science with code)
- hasPhysicalComponent = true for domains requiring physical activity or hands-on material work
- hasCreativeComponent = true for art, design, music, writing, or creative production
- primaryLanguage = the programming language if coding-related, null otherwise
- suggestedTooling = relevant tools, frameworks, or equipment (max 10)`;
  }

  protected buildUserPrompt(
    input: DomainClassifierInput,
    _context: GeneratorContext,
  ): string {
    return `Classify this learning domain:

Goal: ${input.goal}
Title: ${input.title}

${jsonFooter()}`;
  }
}

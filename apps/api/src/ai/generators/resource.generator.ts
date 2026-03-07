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
import { AiResourceSchema, type AiResourceResult } from '../schemas/resource.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';
import { jsonInstructionHeader, jsonFooter, activeMilestoneSection } from '../core/prompt-builder';

export interface ResourceGeneratorInput {
  skillDomain: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  taskTitle?: string;
}

@Injectable()
export class ResourceGenerator extends BaseGenerator<
  ResourceGeneratorInput,
  AiResourceResult
> {
  protected readonly generatorType = 'resource';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.3;
  protected readonly maxTokens = 1024;
  protected readonly outputSchema = AiResourceSchema;
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

  protected getCacheKey(input: ResourceGeneratorInput): string {
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.level}`)
      .digest('hex')
      .slice(0, 16);
    return `resource:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    let prompt = `You are Plan2Skill's learning resource curator. You recommend high-quality, real-world learning resources for specific skill domains and difficulty levels.

${jsonInstructionHeader()}

**Output JSON schema:**
{
  "resources": [
    {
      "title": "string (5-200 chars)",
      "url": "string (5-500 chars) — real URL to the resource",
      "type": "article|video|documentation|course|tool",
      "description": "string (10-500 chars) — what the learner will gain",
      "difficulty": "beginner|intermediate|advanced",
      "freeAccess": boolean — whether the resource is free
    }
  ]
}

**Rules:**
- Recommend 3-7 resources per call
- CRITICAL: Only recommend URLs you are highly confident are real and active
  - Prefer well-known domains: official docs, MDN, YouTube channels, Coursera, freeCodeCamp, etc.
  - If you are unsure a URL exists, use the base domain URL instead of guessing a specific path
  - NEVER fabricate or hallucinate URLs — an incorrect URL is worse than no URL
- Mix resource types: articles, videos, documentation, courses, tools
- Match difficulty to the requested level
- Prioritize free resources but include premium ones if they are exceptional
- Descriptions should explain what the learner will gain, not just describe the resource
- Order resources by relevance and quality`;

    // L2: Roadmap context for targeted resources
    if (context.roadmapContext) {
      const rc = context.roadmapContext;
      prompt += `\n\n**Roadmap Context:**`;
      prompt += `\n- Goal: ${rc.goal}`;
      prompt += activeMilestoneSection(rc);
      prompt += `\nPrioritize resources aligned with the roadmap goal and active milestone.`;
    }

    prompt += buildLocaleInstruction(context.learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: ResourceGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Recommend learning resources for skill domain "${input.skillDomain}".

**Parameters:**
- Difficulty level: ${input.level}`;

    if (input.taskTitle) {
      prompt += `\n- Related task: ${input.taskTitle}`;
    }

    prompt += `\n\n${jsonFooter()}`;

    return prompt;
  }
}

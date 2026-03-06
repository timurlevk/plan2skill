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
import { ArticleBodySchema, type ArticleBodyResult } from '../schemas/article-body.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';

export interface ArticleBodyInput {
  skillDomain: string;
  taskTitle: string;
  bloomLevel: string;
  taskDescription: string;
  domainCategory: string;
  hasCodingComponent: boolean;
}

@Injectable()
export class ArticleBodyGenerator extends BaseGenerator<
  ArticleBodyInput,
  ArticleBodyResult
> {
  protected readonly generatorType = 'article-body';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.5;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = ArticleBodySchema;
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

  protected getCacheKey(input: ArticleBodyInput): string {
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.taskTitle}:${input.bloomLevel}`)
      .digest('hex')
      .slice(0, 16);
    return `article-body:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile } = context;

    let prompt = `You are Plan2Skill's expert educational content writer. You create clear, engaging, and structured learning articles that help students understand concepts thoroughly.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "articleBody": "string (100-10000 chars) — markdown-formatted educational article"
}

**Rules:**
- Write 200-1500 words of educational content
- Use markdown formatting: headings (##, ###), bullet points, bold for key terms
- Structure: Introduction → Core Concepts → Examples → Summary
- Match the Bloom's taxonomy level of the content:
  - remember/understand: focus on definitions, explanations, analogies
  - apply/analyze: include practical examples, step-by-step guides
  - evaluate/create: discuss trade-offs, comparisons, design decisions
- Be educational but engaging — use clear language, avoid jargon without explanation
- Include 2-3 practical examples or analogies`;

    // No code blocks for non-coding domains
    prompt += `\n- IMPORTANT: Do NOT include code blocks (\`\`\`) unless the domain involves programming or coding`;

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

    // L2: Roadmap context
    if (context.roadmapContext) {
      const rc = context.roadmapContext;
      prompt += `\n\n**Roadmap Context:**`;
      prompt += `\n- Goal: ${rc.goal}`;
      const activeMilestone = rc.milestones.find(
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
    input: ArticleBodyInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Write an educational article for the task: "${input.taskTitle}"

**Parameters:**
- Skill domain: ${input.skillDomain}
- Bloom's level: ${input.bloomLevel}
- Domain category: ${input.domainCategory}`;

    if (input.taskDescription) {
      prompt += `\n- Task description: ${input.taskDescription}`;
    }

    if (input.hasCodingComponent) {
      prompt += `\n- This domain involves coding — you may include code examples`;
    } else {
      prompt += `\n- This is a non-coding domain — do NOT include code blocks`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

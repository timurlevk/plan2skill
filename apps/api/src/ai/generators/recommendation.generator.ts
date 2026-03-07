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
import { AiRecommendationSchema, type AiRecommendationResult } from '../schemas/recommendation.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';
import {
  jsonInstructionHeader,
  jsonFooter,
  roadmapContextSection,
  ledgerInsightsSection,
} from '../core/prompt-builder';

export interface RecommendationGeneratorInput {
  completedSkillDomains: string[];
  currentSkillDomains: string[];
  userLevel: number;
  interests?: string[];
}

@Injectable()
export class RecommendationGenerator extends BaseGenerator<
  RecommendationGeneratorInput,
  AiRecommendationResult
> {
  protected readonly generatorType = 'recommendation';
  protected readonly modelTier = ModelTier.BUDGET;
  protected readonly temperature = 0.5;
  protected readonly maxTokens = 1024;
  protected readonly outputSchema = AiRecommendationSchema;
  protected readonly cacheTtlSeconds = 3600;

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

  protected getCacheKey(input: RecommendationGeneratorInput): string {
    const allDomains = [
      ...input.completedSkillDomains,
      ...input.currentSkillDomains,
    ].sort();
    const hash = createHash('sha256')
      .update(`${allDomains.join(',')}:${input.userLevel}`)
      .digest('hex')
      .slice(0, 16);
    return `recommendation:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile } = context;

    let prompt = `You are Plan2Skill's learning path advisor. You analyze a learner's completed and current skills to recommend the most impactful next steps.

${jsonInstructionHeader()}

**Output JSON schema:**
{
  "recommendations": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "skillDomain": "string (1-50 chars)",
      "reason": "string (10-300 chars) — why this skill is recommended",
      "priority": "high|medium|low"
    }
  ]
}

**Rules:**
- Provide 3-7 recommendations, ranked by priority
- Identify skill gaps: what's missing given the learner's completed domains
- Consider natural skill progressions and prerequisites
- High priority: critical gaps blocking advancement
- Medium priority: beneficial complementary skills
- Low priority: nice-to-have expansions or explorations
- Avoid recommending skills already completed or currently in progress
- Each reason must explain the strategic value of learning this skill
- Consider the learner's level when recommending complexity`;

    // L1: User context
    prompt += `\n\n**User Context:**`;
    prompt += `\n- Level: ${learnerProfile.level}`;
    prompt += `\n- Total XP: ${learnerProfile.totalXp}`;
    prompt += `\n- Current streak: ${learnerProfile.currentStreak} days`;
    prompt += `\n- Recent completions (30d): ${learnerProfile.recentCompletions}`;

    // L2: Roadmap context
    prompt += roadmapContextSection(context.roadmapContext);
    if (context.roadmapContext) {
      prompt += `\nRecommendations should complement the roadmap goal.`;
    }

    // L4: Learner insights — recommend practice in weak areas
    prompt += ledgerInsightsSection(context.ledgerContext);

    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: RecommendationGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Recommend next skills for this learner.

**Learner Profile:**
- User level: ${input.userLevel}
- Completed skill domains: ${input.completedSkillDomains.length > 0 ? input.completedSkillDomains.join(', ') : 'none yet'}
- Currently learning: ${input.currentSkillDomains.length > 0 ? input.currentSkillDomains.join(', ') : 'none yet'}`;

    if (input.interests?.length) {
      prompt += `\n- Interests: ${input.interests.join(', ')}`;
    }

    prompt += `\n\n${jsonFooter()}`;

    return prompt;
  }
}

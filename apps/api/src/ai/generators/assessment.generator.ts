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
import { AiAssessmentSchema, type AiAssessment } from '../schemas/assessment.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';

export interface AssessmentGeneratorInput {
  skillDomain: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  goal: string;
  questionCount: number;
}

@Injectable()
export class AssessmentGenerator extends BaseGenerator<
  AssessmentGeneratorInput,
  AiAssessment
> {
  protected readonly generatorType = 'assessment';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.4;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = AiAssessmentSchema;
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

  protected getCacheKey(input: AssessmentGeneratorInput): string {
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.experienceLevel}:${input.questionCount}`)
      .digest('hex')
      .slice(0, 16);
    return `assessment:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile } = context;

    let prompt = `You are Plan2Skill's assessment engine. You generate skill assessment questions to calibrate learner proficiency.

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
      "skillDomain": "string (1-50 chars)",
      "difficultyElo": number (800-2000),
      "distractorTypes": ["3 distractor types from: common_misconception, partial_knowledge, similar_concept, syntax_error"]
    }
  ],
  "targetBloomLevel": "remember|understand|apply|analyze|evaluate|create",
  "skillDomain": "string (1-50 chars)"
}

**Rules:**
- Exactly 4 options per question, exactly 1 correct answer
- correctIndex must be 0, 1, 2, or 3
- Distractor types:
  - common_misconception: popular wrong belief
  - partial_knowledge: correct for a different but related topic
  - similar_concept: confuses related concepts
  - syntax_error: surface-level plausible but fundamentally wrong
- Bloom's level progression: mix of levels around the target
- Elo difficulty targeting:
  - beginner: 800-1100
  - intermediate: 1100-1400
  - advanced: 1400-1700
  - expert: 1700-2000
- Questions should be practical and scenario-based, not trivia
- Explanations should teach, not just confirm the correct answer`;

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
      if (activeMilestone) {
        prompt += `\n- Active milestone: "${activeMilestone.title}"`;
        if (activeMilestone.skillDomains.length > 0) {
          prompt += `\n- Milestone topics: ${activeMilestone.skillDomains.join(', ')}`;
        }
      }
    }

    // L4: Learner insights — target known misconceptions
    if (context.ledgerContext?.insights.length) {
      const misconceptions = context.ledgerContext.insights
        .filter((i) => i.insightType === 'misconception' || i.insightType === 'error_pattern')
        .slice(0, 3);
      if (misconceptions.length > 0) {
        prompt += `\n\n**Known Misconceptions to Test:**`;
        for (const m of misconceptions) {
          prompt += `\n- ${m.title}: ${m.description}`;
        }
        prompt += `\nInclude questions that probe these known weak areas.`;
      }
    }

    prompt += `

## Example Output (abbreviated)
{
  "questions": [
    {
      "question": "You have an array of user objects. Which method returns a NEW array containing only users older than 18?",
      "options": [
        "users.filter(u => u.age > 18)",
        "users.find(u => u.age > 18)",
        "users.map(u => u.age > 18)",
        "users.forEach(u => u.age > 18)"
      ],
      "correctIndex": 0,
      "explanation": "Array.filter() returns a new array with all elements that pass the test. find() returns only the first match, map() transforms elements, and forEach() returns undefined.",
      "bloomLevel": "apply",
      "skillDomain": "JavaScript Arrays",
      "difficultyElo": 1150,
      "distractorTypes": ["similar_concept", "similar_concept", "common_misconception"]
    }
  ],
  "targetBloomLevel": "apply",
  "skillDomain": "JavaScript Arrays"
}
(Generate the requested number of questions in your actual output.)`;

    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: AssessmentGeneratorInput,
    _context: GeneratorContext,
  ): string {
    const bloomMap: Record<string, string> = {
      beginner: 'remember',
      intermediate: 'understand',
      advanced: 'apply',
      expert: 'analyze',
    };

    let prompt = `Generate a ${input.questionCount}-question assessment for skill domain "${input.skillDomain}".

**Parameters:**
- Experience level: ${input.experienceLevel}
- Target Bloom's level: ${bloomMap[input.experienceLevel] ?? 'understand'}
- Goal: ${input.goal}
- Question count: ${input.questionCount}`;

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

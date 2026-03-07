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
import { AiCodeChallengeSchema, type AiCodeChallengeResult } from '../schemas/code-challenge.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';
import { BLOOM_LEVEL_DOC } from '../core/prompt-constants';
import {
  jsonInstructionHeader,
  jsonFooter,
  skillEloSection,
  activeMilestoneSection,
  missingDataGuidance,
} from '../core/prompt-builder';

export interface CodeChallengeGeneratorInput {
  language: string;
  skillDomain: string;
  bloomLevel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  taskTitle?: string;
}

@Injectable()
export class CodeChallengeGenerator extends BaseGenerator<
  CodeChallengeGeneratorInput,
  AiCodeChallengeResult
> {
  protected readonly generatorType = 'code-challenge';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.5;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = AiCodeChallengeSchema;
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

  protected getCacheKey(input: CodeChallengeGeneratorInput): string {
    const hash = createHash('sha256')
      .update(`${input.language}:${input.skillDomain}:${input.bloomLevel}:${input.difficulty}`)
      .digest('hex')
      .slice(0, 16);
    return `code-challenge:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile } = context;

    let prompt = `You are Plan2Skill's expert coding challenge designer. You create well-structured, educational coding challenges with test cases and progressive hints.

${jsonInstructionHeader()}

**Output JSON schema:**
{
  "title": "string (5-200 chars) — challenge title",
  "description": "string (10-2000 chars) — detailed problem description with examples",
  "starterCode": "string (1-2000 chars) — boilerplate/starter code with TODO comments",
  "testCases": [
    {
      "input": "string (1-1000 chars) — test input",
      "expectedOutput": "string (1-1000 chars) — expected output",
      "isHidden": boolean — whether the test is hidden from the learner
    }
  ],
  "hints": ["string (5-300 chars) — progressive hints, from subtle to specific"],
  "solutionExplanation": "string (10-1000 chars) — explanation of the optimal approach"
}

**Rules:**
- The challenge must be solvable in a single function or short program
- Starter code should include:
  - Function signature with parameter types
  - TODO comments indicating where to write code
  - Any necessary imports or boilerplate
- Test cases: provide 3-5 total
  - First 2 test cases must have isHidden: false (visible to learner)
  - Remaining test cases must have isHidden: true (used for validation only)
  - Include edge cases in hidden tests
- Hints: provide 2-4 progressive hints
  - First hint: conceptual nudge (what approach to consider)
  - Middle hints: more specific guidance
  - Last hint: near-solution guidance without giving away the answer
- Difficulty calibration:
  - easy: straightforward logic, single concept, 5-15 min
  - medium: combines 2-3 concepts, requires planning, 15-30 min
  - hard: complex logic, optimization, edge cases, 30-60 min
- Bloom's level alignment (${BLOOM_LEVEL_DOC}):
  - remember/understand: fill-in-the-blank style, complete a partially written function
  - apply: implement a function from a clear specification
  - analyze/evaluate: debug, optimize, or refactor existing code
  - create: design a solution from scratch with minimal guidance
- Solution explanation should teach the underlying concept, not just describe the code`;

    // L1: User context
    prompt += `\n\n**User Context:**`;
    prompt += `\n- Level: ${learnerProfile.level}`;
    prompt += skillEloSection(learnerProfile.skillElos);

    // L2: Roadmap milestone context
    prompt += activeMilestoneSection(context.roadmapContext);

    prompt += missingDataGuidance();
    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: CodeChallengeGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Create a coding challenge.

**Parameters:**
- Programming language: ${input.language}
- Skill domain: ${input.skillDomain}
- Bloom's taxonomy level: ${input.bloomLevel}
- Difficulty: ${input.difficulty}`;

    if (input.taskTitle) {
      prompt += `\n- Task context: ${input.taskTitle}`;
    }

    prompt += `\n\n${jsonFooter()}`;

    return prompt;
  }
}

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
import { AiExerciseSetSchema, type AiExerciseSetResult } from '../schemas/exercise.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';
import type { ExerciseTypeSelection } from '../core/exercise-selector';

export interface ExerciseInput {
  skillDomain: string;
  taskTitle: string;
  bloomLevel: string;
  domainCategory: string;
  hasCodingComponent: boolean;
  selectedTypes: ExerciseTypeSelection[];
  articleContext?: string;
}

@Injectable()
export class ExerciseGenerator extends BaseGenerator<
  ExerciseInput,
  AiExerciseSetResult
> {
  protected readonly generatorType = 'exercise';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.6;
  protected readonly maxTokens = 3000;
  protected readonly outputSchema = AiExerciseSetSchema;
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

  protected getCacheKey(input: ExerciseInput): string {
    const typeStr = input.selectedTypes.map((s) => `${s.type}:${s.difficulty}`).join(',');
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.taskTitle}:${input.bloomLevel}:${typeStr}`)
      .digest('hex')
      .slice(0, 16);
    return `exercise:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile } = context;

    let prompt = `You are Plan2Skill's exercise generation engine. You create diverse, pedagogically sound exercises that reinforce learning through active practice.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "exercises": [
    // Each exercise is a discriminated union on the "type" field.
    // All exercises share: id (string), type (string), difficulty ("easy"|"medium"|"hard"), bloomLevel (string), points (number).
    // Type-specific fields:
    //
    // type "mcq": question, options (string[], 3-6), correctIndex (number), explanation
    // type "true_false": statement, correctAnswer (boolean), explanation
    // type "fill_blank": sentence (with ___ blank), acceptedAnswers (string[]), explanation
    // type "matching": pairs ([{left, right}], 2-8), explanation
    // type "drag_drop": items (string[], shuffled), correctOrder (string[]), explanation
    // type "code_completion": starterCode, solution, testCases (string[]), hints (string[]), language
    // type "free_text": prompt, rubric, sampleAnswer, keywords (string[])
    // type "parsons": codeLines (shuffled), correctOrder (string[]), language, explanation
  ]
}

**Rules:**
- Generate EXACTLY the exercise types and difficulties requested in the user prompt
- Each exercise must have a unique "id" field (e.g. "ex-1", "ex-2", "ex-3")
- Points: easy = 10, medium = 20, hard = 30
- Bloom level must match the specified level for each exercise
- MCQ: options must have exactly 4 choices with 1 correct answer
- True/False: statement must be unambiguous
- Fill blank: use "___" for the blank in the sentence; provide at least 2 accepted answers when reasonable
- Matching: pairs must be clear and unambiguous; provide 3-6 pairs
- Drag & Drop: items are shuffled; correctOrder shows the right sequence
- Code completion: provide working starterCode with a clear gap and complete solution
- Parsons: codeLines are shuffled; correctOrder is the correct sequence
- Free text: provide a clear rubric and 3+ keywords for automated checking
- All explanations should be educational, explaining WHY the answer is correct`;

    // No code blocks for non-coding domains
    prompt += `\n- IMPORTANT: Do NOT generate code_completion or parsons exercises unless the domain involves programming`;

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
    input: ExerciseInput,
    _context: GeneratorContext,
  ): string {
    const typesDescription = input.selectedTypes
      .map((s, i) => `  ${i + 1}. type="${s.type}", difficulty="${s.difficulty}"`)
      .join('\n');

    let prompt = `Generate exercises for the task: "${input.taskTitle}"

**Parameters:**
- Skill domain: ${input.skillDomain}
- Bloom's level: ${input.bloomLevel}
- Domain category: ${input.domainCategory}
- Coding domain: ${input.hasCodingComponent ? 'yes' : 'no'}

**Required exercises (generate EXACTLY these):**
${typesDescription}`;

    if (input.articleContext) {
      // Truncate article context to avoid exceeding token limits
      const truncated = input.articleContext.length > 1500
        ? input.articleContext.slice(0, 1500) + '...'
        : input.articleContext;
      prompt += `\n\n**Article context (base exercises on this content):**\n${truncated}`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

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
import {
  AiQuestAssistantSchema,
  type AiQuestAssistantResult,
  type QuestAssistantMode,
} from '../schemas/quest-assistant.schema';
import { buildLocaleInstruction } from '../core/locale-utils';

export interface QuestAssistantInput {
  taskId: string;
  mode: QuestAssistantMode;
  userMessage?: string;
}

@Injectable()
export class QuestAssistantGenerator extends BaseGenerator<
  QuestAssistantInput,
  AiQuestAssistantResult
> {
  protected readonly generatorType = 'quest-assistant';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.6;
  protected readonly maxTokens = 1024;
  protected readonly outputSchema = AiQuestAssistantSchema;
  protected readonly cacheTtlSeconds = 0; // No caching — responses are contextual

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

  /** L3: Pass taskId to context enrichment for quest session data */
  protected getTaskId(input: QuestAssistantInput): string {
    return input.taskId;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile, domainModel, questSession } = context;

    let prompt = `You are Plan2Skill's quest assistant — a helpful tutor embedded in a gamified learning platform. You help learners when they're stuck, give feedback on their attempts, and guide them toward mastery.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "mode": "hint | feedback | reattempt",
  "message": "string (5-2000 chars) — your main response",
  "encouragement": "string (optional, max 200 chars) — a brief motivational line",
  "nextSteps": ["string (optional, max 3 items, each max 200 chars) — suggested actions"]
}

**Behavioral rules by mode:**

**hint mode:**
- Provide a progressive hint — each request should reveal slightly more
- First hint: conceptual nudge (what to think about)
- Second hint: more specific direction
- Third+ hint: near-answer guidance without giving the full answer
- Never reveal the correct answer directly
- Reference the learner's previous attempts if available

**feedback mode:**
- Analyze the learner's attempt (correct or incorrect)
- If correct: celebrate, explain WHY it's correct, suggest deeper understanding
- If incorrect: explain the misconception without being judgmental, point toward the right direction
- Reference the specific question/answer from the knowledge check

**reattempt mode:**
- The learner is trying again after a wrong answer
- Provide encouragement + a teaching moment
- Explain the concept behind the question at a simpler level
- Suggest a mental model or mnemonic to help remember
- Do NOT give the answer directly — guide discovery

**tutor mode:**
- Act as a personal tutor: explain the topic clearly and thoroughly
- Break down complex concepts into simpler parts with analogies
- Adapt explanation depth to the learner's level
- Provide examples and counter-examples to solidify understanding
- Encourage questions and suggest what to explore next`;

    // L0: Archetype style
    if (domainModel.archetypeBlueprint) {
      prompt += `\n\n**Communication Style:** ${domainModel.archetypeBlueprint.motivationalStyle}`;
    }

    // L1: User level for calibration
    prompt += `\n\n**Learner Context:**`;
    prompt += `\n- Level: ${learnerProfile.level}`;
    prompt += `\n- Streak: ${learnerProfile.currentStreak} days`;

    // L2: Roadmap context — frame hints in the learning goal
    if (context.roadmapContext) {
      prompt += `\n\n**Learning Goal:** ${context.roadmapContext.goal}`;
      const activeMilestone = context.roadmapContext.milestones.find(
        (m) => m.status === 'active' || m.status === 'in_progress',
      );
      if (activeMilestone) {
        prompt += ` (current milestone: "${activeMilestone.title}")`;
      }
      prompt += `\nFrame your response in the context of this broader learning journey.`;
    }

    // L3: Quest session — the critical context
    if (questSession) {
      prompt += `\n\n**Current Quest:**`;
      prompt += `\n- Task: "${questSession.taskTitle}" (${questSession.taskType})`;
      prompt += `\n- Skill domain: ${questSession.skillDomain ?? 'general'}`;
      prompt += `\n- Bloom's level: ${questSession.bloomLevel ?? 'understand'}`;
      prompt += `\n- Difficulty tier: ${questSession.difficultyTier}/5`;

      if (questSession.knowledgeCheck) {
        const kc = questSession.knowledgeCheck;
        prompt += `\n\n**Knowledge Check:**`;
        prompt += `\n- Question: "${kc.question}"`;
        prompt += `\n- Options: ${kc.options.map((o, i) => `[${i}] ${o}`).join(', ')}`;
        prompt += `\n- Correct answer index: ${kc.correctIndex}`;
        prompt += `\n- Explanation: "${kc.explanation}"`;
      }

      if (questSession.attempts.length > 0) {
        prompt += `\n\n**Previous Attempts (${questSession.attempts.length}):**`;
        for (const a of questSession.attempts) {
          prompt += `\n- Attempt #${a.attemptNumber}: `;
          if (a.selectedIndex !== undefined) {
            prompt += `selected option [${a.selectedIndex}], ${a.correct ? 'CORRECT' : 'WRONG'}`;
          }
          if (a.hintsRequested > 0) prompt += `, ${a.hintsRequested} hints used`;
          if (a.timeSpentSeconds) prompt += `, ${a.timeSpentSeconds}s`;
        }
      }

      prompt += `\n- Total hints requested: ${questSession.hintsRequestedTotal}`;
    }

    // L4: Ledger — known misconceptions
    if (context.ledgerContext?.insights.length) {
      const relevant = context.ledgerContext.insights
        .filter((i) => i.insightType === 'error_pattern' || i.insightType === 'misconception')
        .slice(0, 2);
      if (relevant.length > 0) {
        prompt += `\n\n**Known Learner Patterns:**`;
        for (const insight of relevant) {
          prompt += `\n- ${insight.title}: ${insight.description}`;
        }
        prompt += `\nConsider these patterns when crafting your response.`;
      }
    }

    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: QuestAssistantInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Mode: ${input.mode}`;

    if (input.userMessage) {
      prompt += `\n\nLearner says: "${input.userMessage}"`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;
    return prompt;
  }
}

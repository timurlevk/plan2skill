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
import { AiQuestBatchSchema, type AiQuestBatch } from '../schemas/quest.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';
import { TASK_TYPE_DOC, QUEST_TYPE_DOC, RARITY_DOC, BLOOM_LEVEL_DOC, FLOW_CATEGORY_DOC } from '../core/prompt-constants';
import {
  jsonInstructionHeader,
  jsonFooter,
  archetypeSection,
  userContextSection,
  skillEloSection,
  ledgerInsightsSection,
  roadmapContextSection,
  activeMilestoneSection,
  rewardRulesDoc,
  rarityDistributionDoc,
  taskQuestTypeMapping,
  missingDataGuidance,
} from '../core/prompt-builder';

export interface QuestGeneratorInput {
  skillDomain: string;
  milestoneId: string;
  count: number;
  dailyMinutes: number;
  existingTaskTitles: string[];
}

@Injectable()
export class QuestGenerator extends BaseGenerator<
  QuestGeneratorInput,
  AiQuestBatch
> {
  protected readonly generatorType = 'quest';
  protected readonly modelTier = ModelTier.BALANCED;
  protected readonly temperature = 0.6;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = AiQuestBatchSchema;
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

  protected getCacheKey(input: QuestGeneratorInput, _context: GeneratorContext): string {
    const date = new Date().toISOString().slice(0, 10);
    const hash = createHash('sha256')
      .update(`${input.skillDomain}:${input.milestoneId}:${date}`)
      .digest('hex')
      .slice(0, 16);
    return `quest:${hash}`;
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile, domainModel } = context;

    let prompt = `You are Plan2Skill's quest generation engine. You create personalized learning quests.

${jsonInstructionHeader()}

**Output JSON schema:**
{
  "quests": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "taskType": "${TASK_TYPE_DOC}",
      "questType": "${QUEST_TYPE_DOC}",
      "estimatedMinutes": number (5-120),
      "xpReward": number (10-500),
      "coinReward": number (1-50),
      "rarity": "${RARITY_DOC}",
      "skillDomain": "string (1-50 chars)",
      "bloomLevel": "${BLOOM_LEVEL_DOC}",
      "flowCategory": "${FLOW_CATEGORY_DOC}",
      "difficultyTier": number (1-5),
      "knowledgeCheck": {
        "question": "string (10-500 chars)",
        "options": ["4 strings, each 1-200 chars"],
        "correctIndex": number (0-3),
        "explanation": "string (10-500 chars)"
      }
    }
  ]
}

**Rules:**
- Flow state distribution: 70% mastery, 20% stretch, 10% review
- Bloom's level should match user's skill proficiency
${rewardRulesDoc()}
${rarityDistributionDoc()}
${taskQuestTypeMapping()}
- Include knowledgeCheck for knowledge and quiz questTypes. For practice and creative questTypes, knowledgeCheck is optional.
- Questions should have exactly 4 options with exactly 1 correct answer
- Distractors should be plausible (common misconceptions, partial knowledge)`;

    // L0: Archetype quest mix
    prompt += archetypeSection(domainModel.archetypeBlueprint);

    // L1: User context
    prompt += `\n` + userContextSection(learnerProfile);
    prompt += skillEloSection(learnerProfile.skillElos);

    // L4: Learner insights
    prompt += ledgerInsightsSection(context.ledgerContext);

    // L2: Roadmap context + active milestone
    if (context.roadmapContext) {
      prompt += roadmapContextSection(context.roadmapContext);
      prompt += activeMilestoneSection(context.roadmapContext);
    }

    prompt += `

## Example Output (abbreviated)
{
  "quests": [
    {
      "title": "Flexbox Layout Patterns",
      "description": "Read an interactive article on CSS Flexbox and practice aligning items in common UI patterns.",
      "taskType": "article",
      "questType": "knowledge",
      "estimatedMinutes": 15,
      "xpReward": 20,
      "coinReward": 5,
      "rarity": "common",
      "skillDomain": "CSS Layouts",
      "bloomLevel": "understand",
      "flowCategory": "mastery",
      "difficultyTier": 2,
      "knowledgeCheck": {
        "question": "Which Flexbox property aligns items along the cross axis?",
        "options": ["justify-content", "align-items", "flex-direction", "flex-wrap"],
        "correctIndex": 1,
        "explanation": "align-items controls alignment on the cross axis, while justify-content controls the main axis."
      }
    }
  ]
}
(Generate the requested number of quests in your actual output.)`;

    prompt += missingDataGuidance();
    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: QuestGeneratorInput,
    context: GeneratorContext,
  ): string {
    const { learnerProfile } = context;

    let prompt = `Generate ${input.count} learning quests for the skill domain "${input.skillDomain}".

**Constraints:**
- Daily time budget: ${input.dailyMinutes} minutes
- Total quest time should not exceed ${input.dailyMinutes} minutes`;

    if (input.existingTaskTitles.length > 0) {
      prompt += `\n\n**Avoid repetition — existing tasks:**`;
      for (const title of input.existingTaskTitles.slice(0, 10)) {
        prompt += `\n- ${title}`;
      }
    }

    if (learnerProfile.skillElos.length) {
      const domainElo = learnerProfile.skillElos.find(
        (e) => e.skillDomain === input.skillDomain,
      );
      if (domainElo) {
        const tier = domainElo.elo < 1000 ? 'beginner' :
          domainElo.elo < 1300 ? 'intermediate' :
          domainElo.elo < 1600 ? 'advanced' : 'expert';
        prompt += `\n\n**Skill proficiency:** ${input.skillDomain} Elo ${domainElo.elo} (${tier}, ${domainElo.assessmentCount} assessments)`;
        prompt += `\nAdjust Bloom's level and difficulty accordingly.`;
      }
    }

    prompt += `\n\n${jsonFooter()}`;

    return prompt;
  }
}

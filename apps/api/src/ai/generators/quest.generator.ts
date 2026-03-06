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
import { AiQuestBatchSchema, type AiQuestBatch } from '../schemas/quest.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { createHash } from 'crypto';

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
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService, rateLimitService, templateService);
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

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "quests": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "taskType": "video|article|quiz|project|review|boss",
      "questType": "knowledge|physical|creative|habit|social|reflection",
      "estimatedMinutes": number (5-120),
      "xpReward": number (10-500),
      "coinReward": number (1-50),
      "rarity": "common|uncommon|rare|epic|legendary",
      "skillDomain": "string (1-50 chars)",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "flowCategory": "stretch|mastery|review",
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
- Rarity: ~50% common, 25% uncommon, 15% rare, 8% epic, 2% legendary
- XP: common 15-25, uncommon 30-50, rare 60-100, epic 120-200, legendary 250-500
- Include knowledgeCheck for knowledge and quiz questTypes. For practice and creative questTypes, knowledgeCheck is optional.
- Questions should have exactly 4 options with exactly 1 correct answer
- Distractors should be plausible (common misconceptions, partial knowledge)`;

    // L0: Archetype quest mix distribution
    if (domainModel.archetypeBlueprint) {
      const bp = domainModel.archetypeBlueprint;
      prompt += `\n\n**Archetype Quest Mix (${bp.archetypeId}):**`;
      prompt += `\n- knowledge: ${(bp.questMix.knowledge * 100).toFixed(0)}%, practice: ${(bp.questMix.practice * 100).toFixed(0)}%, creative: ${(bp.questMix.creative * 100).toFixed(0)}%, boss: ${(bp.questMix.boss * 100).toFixed(0)}%`;
      prompt += `\n- Preferred Bloom's levels: ${bp.preferredBloomLevels.join(', ')}`;
      prompt += `\nDistribute quest types according to this archetype mix.`;
    }

    // L1: User context
    prompt += `\n\n**User Context:**`;
    prompt += `\n- Level: ${learnerProfile.level}`;
    prompt += `\n- Current streak: ${learnerProfile.currentStreak} days`;
    prompt += `\n- Average quality: ${(learnerProfile.averageQualityScore * 100).toFixed(0)}%`;

    if (learnerProfile.skillElos.length > 0) {
      const eloStr = learnerProfile.skillElos
        .slice(0, 5)
        .map((e) => `${e.skillDomain}(${e.elo}, ${e.assessmentCount} assessments)`)
        .join(', ');
      prompt += `\n- Skill Elo: ${eloStr}`;
    }

    if (learnerProfile.preferredTaskTypes.length > 0) {
      prompt += `\n- Preferred types: ${learnerProfile.preferredTaskTypes.join(', ')}`;
    }
    prompt += `\n- Avg time ratio: ${learnerProfile.averageTimeSpentRatio.toFixed(2)} (>1 = takes longer than estimated)`;

    if (learnerProfile.dreamGoal) {
      prompt += `\n- Dream goal: ${learnerProfile.dreamGoal}`;
    }
    if (learnerProfile.interests?.length) {
      prompt += `\n- Interests: ${learnerProfile.interests.join(', ')}`;
    }
    if (learnerProfile.dueReviewCount > 0) {
      prompt += `\n- Due reviews: ${learnerProfile.dueReviewCount} (consider including review-type quests)`;
    }

    // L4: Learner insights — avoid known weak areas or target them
    if (context.ledgerContext?.insights.length) {
      const patterns = context.ledgerContext.insights
        .filter((i) => i.insightType === 'error_pattern' || i.insightType === 'misconception')
        .slice(0, 3);
      if (patterns.length > 0) {
        prompt += `\n\n**Known Learner Patterns:**`;
        for (const p of patterns) {
          prompt += `\n- ${p.title}: ${p.description}`;
        }
        prompt += `\nInclude review-type quests that address these patterns.`;
      }
    }

    // L2: Roadmap context
    if (context.roadmapContext) {
      const rc = context.roadmapContext;
      prompt += `\n\n**Roadmap Context:**`;
      prompt += `\n- Goal: ${rc.goal}`;
      const activeMilestone = rc.milestones.find((m) => m.status === 'active' || m.status === 'in_progress');
      if (activeMilestone) {
        prompt += `\n- Active milestone: "${activeMilestone.title}" (${activeMilestone.completedTasks}/${activeMilestone.totalTasks} tasks done)`;
        if (activeMilestone.skillDomains.length > 0) {
          prompt += `\n- Milestone skill domains: ${activeMilestone.skillDomains.join(', ')}`;
        }
      }
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

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

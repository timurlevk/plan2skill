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
import { AiRoadmapSchema, type AiRoadmapResult } from '../schemas/roadmap.schema';

export interface RoadmapGeneratorInput {
  goal: string;
  dailyMinutes: number;
  currentRole?: string;
  experienceLevel?: string;
  selectedTools?: string[];
  superpower?: string;
  currentKnowledge?: string;
  interests?: string[];
}

@Injectable()
export class RoadmapGenerator extends BaseGenerator<
  RoadmapGeneratorInput,
  AiRoadmapResult
> {
  protected readonly generatorType = 'roadmap';
  protected readonly modelTier = ModelTier.QUALITY;
  protected readonly temperature = 0.7;
  protected readonly maxTokens = 4096;
  protected readonly outputSchema = AiRoadmapSchema;

  constructor(
    @Inject(LLM_CLIENT_TOKEN) llmClient: ILlmClient,
    tracer: LlmTracer,
    cacheService: CacheService,
    contextService: ContextEnrichmentService,
    safetyService: ContentSafetyService,
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService);
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { userProfile, learningContext, characterContext } = context;

    let systemPrompt = `You are Plan2Skill's AI roadmap architect. You create personalized 90-day learning roadmaps.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "title": "string — roadmap title (5-200 chars)",
  "description": "string — 1-2 sentence description (10-500 chars)",
  "milestones": [
    {
      "title": "string (5-200 chars)",
      "description": "string (10-500 chars)",
      "weekStart": number (1-52),
      "weekEnd": number (1-52),
      "tasks": [
        {
          "title": "string (5-200 chars)",
          "description": "string — 1-2 sentences (10-500 chars)",
          "taskType": "video|article|quiz|project|review|boss",
          "estimatedMinutes": number (5-120),
          "xpReward": number (10-500),
          "coinReward": number (1-50),
          "rarity": "common|uncommon|rare|epic|legendary",
          "skillDomain": "string — skill domain (1-50 chars)",
          "bloomLevel": "remember|understand|apply|analyze|evaluate|create"
        }
      ]
    }
  ]
}

**Rules:**
- Create 4-12 milestones spanning 90 days
- Each milestone has 5-20 tasks
- Mix task types: video, article, quiz, project, review, boss
- First milestone should be beginner-friendly with Bloom's "remember" and "understand" levels
- Include at least 1 boss-type task per milestone — bosses must be "epic" or "legendary" rarity
- Every task MUST have a skillDomain — the specific skill topic it covers
- Bloom's progression: early milestones use remember→understand, middle use apply→analyze, later use evaluate→create
- XP rewards: Common 15-25, Uncommon 30-50, Rare 60-100, Epic 120-200, Legendary 250-500
- Coin rewards: 5-10 per task, bonus 15-30 for projects/boss
- Rarity distribution: ~40% common, 25% uncommon, 20% rare, 10% epic, 5% legendary`;

    // Inject user context
    systemPrompt += `\n\n**User Context:**`;
    systemPrompt += `\n- Level: ${userProfile.level}`;
    systemPrompt += `\n- Total XP: ${userProfile.totalXp}`;

    if (userProfile.archetypeId) {
      systemPrompt += `\n- Archetype: ${userProfile.archetypeId}`;
    }

    if (learningContext) {
      systemPrompt += `\n- Current streak: ${learningContext.currentStreak} days`;
      systemPrompt += `\n- Recent completions (30d): ${learningContext.recentCompletions}`;
      if (learningContext.skillElos.length > 0) {
        const eloStr = learningContext.skillElos
          .slice(0, 5)
          .map((e) => `${e.skillDomain}(${e.elo})`)
          .join(', ');
        systemPrompt += `\n- Skill proficiency: ${eloStr}`;
      }
    }

    if (characterContext) {
      const attrs = characterContext.attributes;
      systemPrompt += `\n- Character: ${characterContext.characterId} (${characterContext.evolutionTier})`;
      systemPrompt += `\n- Top attributes: STR=${attrs.strength} INT=${attrs.intelligence} CHA=${attrs.charisma}`;
    }

    return systemPrompt;
  }

  protected buildUserPrompt(
    input: RoadmapGeneratorInput,
    context: GeneratorContext,
  ): string {
    let prompt = `Create a 90-day personalized learning roadmap.

**Learner Profile:**
- Goal: ${input.goal}
- Daily Time: ${input.dailyMinutes} minutes/day`;

    if (input.currentRole) {
      prompt += `\n- Current Role: ${input.currentRole}`;
    }
    if (input.experienceLevel) {
      prompt += `\n- Experience Level: ${input.experienceLevel}`;
    }
    if (input.superpower) {
      prompt += `\n- Superpower Focus: ${input.superpower}`;
    }
    if (input.selectedTools?.length) {
      prompt += `\n- Tools: ${input.selectedTools.join(', ')}`;
    }
    if (input.currentKnowledge) {
      prompt += `\n- Current Knowledge: ${input.currentKnowledge}`;
    }
    if (input.interests?.length) {
      prompt += `\n- Interests: ${input.interests.join(', ')}`;
    }

    // Enrich with context
    if (context.learningContext?.skillElos.length) {
      prompt += `\n\n**Existing Skill Proficiency (Elo ratings):**`;
      for (const elo of context.learningContext.skillElos.slice(0, 5)) {
        prompt += `\n- ${elo.skillDomain}: ${elo.elo}`;
      }
      prompt += `\nAdjust difficulty to challenge but not overwhelm. Tasks in known domains should start at "apply" or higher Bloom's level.`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

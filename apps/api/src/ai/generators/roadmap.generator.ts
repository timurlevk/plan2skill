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
import { AiRoadmapSchema, type AiRoadmapResult } from '../schemas/roadmap.schema';
import { buildLocaleInstruction } from '../core/locale-utils';

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
    rateLimitService: AiRateLimitService,
    templateService: TemplateService,
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService, rateLimitService, templateService);
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile, domainModel } = context;

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
          "taskType": "article|quiz|project|review|boss|reflection",
          "questType": "knowledge|practice|creative|boss|physical|habit|social|reflection (optional — defaults to knowledge)",
          "flowCategory": "stretch|mastery|review (optional — defaults to mastery)",
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
- questType classifies the learning approach: knowledge (reading/watching), practice (hands-on), creative (build something new), boss (challenge), etc.
- flowCategory indicates the zone: stretch (new/hard), mastery (solidifying), review (reinforcing known material)
- Bloom's progression: early milestones use remember→understand, middle use apply→analyze, later use evaluate→create
- XP rewards: Common 15-25, Uncommon 30-50, Rare 60-100, Epic 120-200, Legendary 250-500
- Coin rewards: 5-10 per task, bonus 15-30 for projects/boss
- Rarity distribution: ~40% common, 25% uncommon, 20% rare, 10% epic, 5% legendary`;

    // L0: Archetype blueprint for quest mix hints
    if (domainModel.archetypeBlueprint) {
      const bp = domainModel.archetypeBlueprint;
      systemPrompt += `\n\n**Archetype: ${bp.archetypeId}**`;
      systemPrompt += `\n- Quest type mix: knowledge ${(bp.questMix.knowledge * 100).toFixed(0)}%, practice ${(bp.questMix.practice * 100).toFixed(0)}%, creative ${(bp.questMix.creative * 100).toFixed(0)}%, boss ${(bp.questMix.boss * 100).toFixed(0)}%`;
      systemPrompt += `\n- Preferred Bloom's levels: ${bp.preferredBloomLevels.join(', ')}`;
      systemPrompt += `\nSkew task types and Bloom's levels toward archetype preferences.`;
    }

    // L1: User context
    systemPrompt += `\n\n**User Context:**`;
    systemPrompt += `\n- Level: ${learnerProfile.level}`;
    systemPrompt += `\n- Total XP: ${learnerProfile.totalXp}`;

    if (learnerProfile.archetypeId) {
      systemPrompt += `\n- Archetype: ${learnerProfile.archetypeId}`;
    }

    systemPrompt += `\n- Current streak: ${learnerProfile.currentStreak} days`;
    systemPrompt += `\n- Recent completions (30d): ${learnerProfile.recentCompletions}`;

    if (learnerProfile.skillElos.length > 0) {
      const eloStr = learnerProfile.skillElos
        .slice(0, 5)
        .map((e) => `${e.skillDomain}(${e.elo})`)
        .join(', ');
      systemPrompt += `\n- Skill proficiency: ${eloStr}`;
    }

    if (learnerProfile.characterAttributes) {
      const attrs = learnerProfile.characterAttributes;
      systemPrompt += `\n- Character: ${learnerProfile.characterId ?? 'unknown'} (${learnerProfile.evolutionTier ?? 'base'})`;
      systemPrompt += `\n- Top attributes: STR=${attrs.strength} INT=${attrs.intelligence} CHA=${attrs.charisma}`;
    }

    systemPrompt += `

## Example Output (abbreviated)
{
  "title": "Full-Stack JavaScript Mastery",
  "description": "A 90-day journey from core JS fundamentals to deploying a full-stack app with React and Node.js.",
  "milestones": [
    {
      "title": "JavaScript Foundations",
      "description": "Build a rock-solid understanding of variables, control flow, functions, and DOM basics.",
      "weekStart": 1,
      "weekEnd": 3,
      "tasks": [
        {
          "title": "Variables & Data Types Deep Dive",
          "description": "Read about let, const, primitives, and reference types in JavaScript.",
          "taskType": "article",
          "estimatedMinutes": 20,
          "xpReward": 20,
          "coinReward": 5,
          "rarity": "common",
          "skillDomain": "JavaScript Basics",
          "bloomLevel": "remember"
        },
        {
          "title": "Control Flow Challenge",
          "description": "Complete a hands-on quiz on if/else, switch, and ternary operators.",
          "taskType": "quiz",
          "estimatedMinutes": 15,
          "xpReward": 25,
          "coinReward": 5,
          "rarity": "common",
          "skillDomain": "JavaScript Basics",
          "bloomLevel": "understand"
        }
      ]
    }
  ]
}
(Show 4-12 milestones with 5-20 tasks each in your actual output.)`;

    systemPrompt += buildLocaleInstruction(learnerProfile.locale);
    return systemPrompt;
  }

  protected buildUserPrompt(
    input: RoadmapGeneratorInput,
    context: GeneratorContext,
  ): string {
    const { learnerProfile } = context;

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

    // L1: Onboarding data (previously write-only)
    if (learnerProfile.dreamGoal && learnerProfile.dreamGoal !== input.goal) {
      prompt += `\n- Dream goal (from onboarding): ${learnerProfile.dreamGoal}`;
    }
    if (learnerProfile.careerTarget) {
      prompt += `\n- Career target: ${learnerProfile.careerTarget}`;
    }
    if (learnerProfile.interests?.length && !input.interests?.length) {
      prompt += `\n- Interests (from onboarding): ${learnerProfile.interests.join(', ')}`;
    }

    // L2: Existing roadmap context (for adjust/regen flows)
    if (context.roadmapContext) {
      const rc = context.roadmapContext;
      prompt += `\n\n**Existing Roadmap Progress:**`;
      prompt += `\n- Current goal: ${rc.goal}`;
      prompt += `\n- Progress: ${rc.progress.toFixed(0)}%`;
      const completedMilestones = rc.milestones.filter((m) => m.status === 'completed');
      if (completedMilestones.length > 0) {
        prompt += `\n- Completed milestones: ${completedMilestones.map((m) => m.title).join(', ')}`;
      }
      const coveredDomains = [...new Set(rc.milestones.flatMap((m) => m.skillDomains))];
      if (coveredDomains.length > 0) {
        prompt += `\n- Covered skill domains: ${coveredDomains.join(', ')}`;
      }
      prompt += `\nBuild upon the existing progress — avoid repeating completed content.`;
    }

    // Enrich with skill proficiency
    if (learnerProfile.skillElos.length) {
      prompt += `\n\n**Existing Skill Proficiency (Elo ratings):**`;
      for (const elo of learnerProfile.skillElos.slice(0, 5)) {
        prompt += `\n- ${elo.skillDomain}: ${elo.elo}`;
      }
      prompt += `\nAdjust difficulty to challenge but not overwhelm. Tasks in known domains should start at "apply" or higher Bloom's level.`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

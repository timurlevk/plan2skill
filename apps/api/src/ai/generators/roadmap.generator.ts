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
import { AiRoadmapSchema, type AiRoadmapResult } from '../schemas/roadmap.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import { TASK_TYPE_DOC, QUEST_TYPE_DOC, RARITY_DOC, BLOOM_LEVEL_DOC, FLOW_CATEGORY_DOC } from '../core/prompt-constants';
import {
  jsonInstructionHeader,
  jsonFooter,
  archetypeSection,
  userContextSection,
  skillEloSection,
  characterSection,
  roadmapContextSection,
  rewardRulesDoc,
  rarityDistributionDoc,
  pacingConstraint,
  taskQuestTypeMapping,
  missingDataGuidance,
} from '../core/prompt-builder';

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
    @Optional() promptTemplateService?: PromptTemplateService,
  ) {
    super(llmClient, tracer, cacheService, contextService, safetyService, rateLimitService, templateService, promptTemplateService);
  }

  protected buildSystemPrompt(context: GeneratorContext): string {
    const { learnerProfile, domainModel } = context;

    let systemPrompt = `You are Plan2Skill's AI roadmap architect. You create personalized 90-day learning roadmaps.

${jsonInstructionHeader()}

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
          "taskType": "${TASK_TYPE_DOC}",
          "questType": "${QUEST_TYPE_DOC} (optional — defaults to knowledge)",
          "flowCategory": "${FLOW_CATEGORY_DOC} (optional — defaults to mastery)",
          "estimatedMinutes": number (5-120),
          "xpReward": number (10-500),
          "coinReward": number (1-50),
          "rarity": "${RARITY_DOC}",
          "skillDomain": "string — skill domain (1-50 chars)",
          "bloomLevel": "${BLOOM_LEVEL_DOC}"
        }
      ]
    }
  ]
}

**Rules:**
- Create 4-12 milestones spanning 90 days
- Each milestone has 5-20 tasks
- Mix task types across all valid values
- First milestone should be beginner-friendly with Bloom's "remember" and "understand" levels
- Include at least 1 boss-type task per milestone — bosses must be "epic" or "legendary" rarity
- Every task MUST have a skillDomain — the specific skill topic it covers
- questType classifies the learning approach: knowledge (reading), practice (hands-on), creative (build something new), boss (challenge), etc.
- flowCategory indicates the zone: stretch (new/hard), mastery (solidifying), review (reinforcing known material)
- Bloom's progression: early milestones use remember→understand, middle use apply→analyze, later use evaluate→create
${rewardRulesDoc()}
${rarityDistributionDoc()}
${taskQuestTypeMapping()}`;

    // Pacing constraint from daily minutes (will be populated in user prompt too)
    // Added here so system prompt has the constraint for DB-template parity

    // L0: Archetype blueprint
    systemPrompt += archetypeSection(domainModel.archetypeBlueprint);

    // L1: User context
    systemPrompt += `\n` + userContextSection(learnerProfile);
    systemPrompt += skillEloSection(learnerProfile.skillElos);
    systemPrompt += characterSection(learnerProfile);

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
        }
      ]
    }
  ]
}
(Show 4-12 milestones with 5-20 tasks each in your actual output.)`;

    systemPrompt += missingDataGuidance();
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

    // Pacing constraint
    const pacing = pacingConstraint(input.dailyMinutes);
    if (pacing) {
      prompt += `\n${pacing}`;
    }

    // L1: Onboarding data
    if (learnerProfile.dreamGoal && learnerProfile.dreamGoal !== input.goal) {
      prompt += `\n- Dream goal (from onboarding): ${learnerProfile.dreamGoal}`;
    }
    if (learnerProfile.careerTarget) {
      prompt += `\n- Career target: ${learnerProfile.careerTarget}`;
    }
    if (learnerProfile.interests?.length && !input.interests?.length) {
      prompt += `\n- Interests (from onboarding): ${learnerProfile.interests.join(', ')}`;
    }

    // L2: Existing roadmap context
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

    // Skill proficiency
    if (learnerProfile.skillElos.length) {
      prompt += `\n\n**Existing Skill Proficiency (Elo ratings):**`;
      for (const elo of learnerProfile.skillElos.slice(0, 5)) {
        prompt += `\n- ${elo.skillDomain}: ${elo.elo}`;
      }
      prompt += `\nAdjust difficulty to challenge but not overwhelm. Tasks in known domains should start at "apply" or higher Bloom's level.`;
    }

    prompt += `\n\n${jsonFooter()}`;

    return prompt;
  }
}

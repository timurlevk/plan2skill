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
import { AiEpisodeSchema, type AiEpisodeResult } from '../schemas/narrative.schema';
import { buildLocaleInstruction } from '../core/locale-utils';
import type { SeasonStateTracker } from '@plan2skill/types';

export interface NarrativeGeneratorInput {
  seasonId: string;
  seasonTitle: string;
  episodeNumber: number;
  globalNumber: number;
  recentSummaries: Array<{ episodeNumber: number; summary: string }>;
  stateTracker: SeasonStateTracker;
  storyBible: {
    worldName: string;
    worldRules: unknown;
    characters: unknown;
    geography: unknown;
  };
  arcOutline: unknown;
  category?: string;
}

@Injectable()
export class NarrativeGenerator extends BaseGenerator<
  NarrativeGeneratorInput,
  AiEpisodeResult
> {
  protected readonly generatorType = 'narrative';
  protected readonly modelTier = ModelTier.QUALITY;
  protected readonly temperature = 0.8;
  protected readonly maxTokens = 2048;
  protected readonly outputSchema = AiEpisodeSchema;

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

    let prompt = `You are the narrative engine for Plan2Skill's world of Lumen.
You write short, episodic fantasy stories (120-180 words per episode body) that inspire learners.

Your output must be valid JSON matching the schema exactly. No markdown fences, no explanation — pure JSON only.

**Output JSON schema:**
{
  "title": "string — 3-7 words, evocative (3-120 chars)",
  "contextSentence": "string — 1 sentence setting the scene (10-300 chars)",
  "body": "string — 120-180 words, narrative prose",
  "cliffhanger": "string — 1-2 sentences ending with suspense (20-400 chars)",
  "sageReflection": "string — 1-2 sentences in Sage's voice connecting story to learning journey (20-400 chars)",
  "summary": "string — 2-3 sentence plot summary for continuity (20-500 chars)",
  "tone": "heroic|mysterious|whimsical|dramatic|contemplative",
  "act": number (1-5, current story act),
  "category": "standard|climax|lore_drop|character_focus|season_finale",
  "continuity": {
    "referencedCharacters": ["string"],
    "referencedLocations": ["string"],
    "plotThreadsContinued": ["string"],
    "newPlotThreads": ["string"]
  }
}

**Rules:**
- Tone: 70% epic grandeur, 30% warm humor
- NEVER: violence, character death, deception by Sage
- Each episode should feel complete yet leave a hook for the next
- Sage's reflection must subtly connect the story to personal growth / learning
- Continuity: reference characters and locations from recent episodes`;

    // L0: Archetype narrative tone
    if (domainModel.archetypeBlueprint) {
      prompt += `\n\n**Archetype Narrative Tone:** ${domainModel.archetypeBlueprint.narrativeTone}`;
      prompt += `\nAdapt the story's voice to feel ${domainModel.archetypeBlueprint.narrativeTone}.`;
    }

    // Narrative-specific context
    if (context.narrativeContext) {
      prompt += `\n\n**Narrative Context:**`;
      prompt += `\n- Current Season: ${context.narrativeContext.currentSeason}`;
      prompt += `\n- Last Read Episode: ${context.narrativeContext.lastEpisodeNumber}`;
      prompt += `\n- Reader Mode: ${context.narrativeContext.narrativeMode}`;
    }

    // L1: Character context
    if (learnerProfile.characterAttributes) {
      const attrs = learnerProfile.characterAttributes;
      prompt += `\n\n**Reader's Character:**`;
      prompt += `\n- Archetype: ${learnerProfile.archetypeId ?? 'unknown'}`;
      prompt += `\n- Evolution Tier: ${learnerProfile.evolutionTier ?? 'base'}`;
      prompt += `\n- Top Attributes: STR=${attrs.strength} INT=${attrs.intelligence} WIS=${attrs.wisdom}`;
    }

    prompt += `

## Example Output (abbreviated)
{
  "title": "The Ember Beneath the Gate",
  "contextSentence": "Dawn broke over the Crystalline Spire as Sage Aleron traced a fading rune on the ancient door.",
  "body": "The apprentice pressed her palm against the stone and felt warmth pulse through the carvings. Light threaded between her fingers like molten gold, illuminating words she had never seen yet somehow understood. Sage Aleron watched from the alcove, his staff casting a long shadow across the mosaic floor. 'The gate responds to intention, not force,' he murmured...",
  "cliffhanger": "As the final glyph ignited, a deep rumble shook the corridor — and from beyond the gate, a voice older than the Spire itself whispered her name.",
  "sageReflection": "Sometimes the greatest breakthroughs come not from pushing harder, but from pausing to truly understand what stands before you.",
  "summary": "The apprentice discovered she could activate the ancient gate through focused intention rather than brute force. Sage Aleron guided her through the process, revealing that the gate responds to understanding. A mysterious voice called from beyond.",
  "tone": "mysterious",
  "act": 2,
  "category": "standard",
  "continuity": {
    "referencedCharacters": ["Sage Aleron", "The Apprentice"],
    "referencedLocations": ["Crystalline Spire"],
    "plotThreadsContinued": ["The sealed gate mystery"],
    "newPlotThreads": ["The voice beyond the gate"]
  }
}
(Write 120-180 words for the body in your actual output.)`;

    prompt += buildLocaleInstruction(learnerProfile.locale);
    return prompt;
  }

  protected buildUserPrompt(
    input: NarrativeGeneratorInput,
    _context: GeneratorContext,
  ): string {
    let prompt = `Generate Episode ${input.episodeNumber} of Season "${input.seasonTitle}".

**World:**
- Name: ${input.storyBible.worldName}
- Rules: ${JSON.stringify(input.storyBible.worldRules)}
- Characters: ${JSON.stringify(input.storyBible.characters)}
- Geography: ${JSON.stringify(input.storyBible.geography)}

**Arc Outline:** ${JSON.stringify(input.arcOutline)}

**Current State:**
- Act: ${input.stateTracker.currentAct}
- Episode: ${input.episodeNumber} (Global #${input.globalNumber})
- Constraints: ${JSON.stringify(input.stateTracker.constraints)}`;

    if (input.recentSummaries.length > 0) {
      prompt += `\n\n**Recent Episode Summaries (for continuity):**`;
      for (const s of input.recentSummaries) {
        prompt += `\n- Episode ${s.episodeNumber}: ${s.summary}`;
      }
    }

    if (input.category) {
      prompt += `\n\n**Target Category:** ${input.category}`;
    }

    prompt += `\n\nReturn ONLY the JSON. No markdown fences, no explanation.`;

    return prompt;
  }
}

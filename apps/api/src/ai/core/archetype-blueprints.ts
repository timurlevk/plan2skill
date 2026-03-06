/**
 * Archetype Blueprints — Character personality definitions for narrative personalization.
 *
 * Each archetype defines narrative tone, quest mix distribution, preferred Bloom's
 * taxonomy levels, and motivational style. Used by generators to personalize
 * content based on the user's chosen archetype.
 *
 * Quest mix values must sum to 1.0 for each archetype.
 */

export interface ArchetypeBlueprint {
  archetypeId: string;
  displayName: string;
  narrativeTone: string;
  questMix: { knowledge: number; practice: number; creative: number; boss: number };
  preferredBloomLevels: string[];
  motivationalStyle: string;
}

export const ARCHETYPE_BLUEPRINTS: Record<string, ArchetypeBlueprint> = {
  strategist: {
    archetypeId: 'strategist',
    displayName: 'Strategist',
    narrativeTone: 'intellectual and curious',
    questMix: { knowledge: 0.4, practice: 0.3, creative: 0.2, boss: 0.1 },
    preferredBloomLevels: ['analyze', 'evaluate'],
    motivationalStyle: 'data-driven encouragement',
  },
  explorer: {
    archetypeId: 'explorer',
    displayName: 'Explorer',
    narrativeTone: 'adventurous and bold',
    questMix: { knowledge: 0.2, practice: 0.3, creative: 0.35, boss: 0.15 },
    preferredBloomLevels: ['create', 'apply'],
    motivationalStyle: 'discovery and wonder',
  },
  connector: {
    archetypeId: 'connector',
    displayName: 'Connector',
    narrativeTone: 'steady and supportive',
    questMix: { knowledge: 0.3, practice: 0.4, creative: 0.15, boss: 0.15 },
    preferredBloomLevels: ['apply', 'understand'],
    motivationalStyle: 'community and protection',
  },
  builder: {
    archetypeId: 'builder',
    displayName: 'Builder',
    narrativeTone: 'creative and expressive',
    questMix: { knowledge: 0.15, practice: 0.3, creative: 0.4, boss: 0.15 },
    preferredBloomLevels: ['create', 'evaluate'],
    motivationalStyle: 'craft and mastery',
  },
  innovator: {
    archetypeId: 'innovator',
    displayName: 'Innovator',
    narrativeTone: 'wise and reflective',
    questMix: { knowledge: 0.35, practice: 0.25, creative: 0.25, boss: 0.15 },
    preferredBloomLevels: ['evaluate', 'analyze'],
    motivationalStyle: 'wisdom and growth',
  },
};

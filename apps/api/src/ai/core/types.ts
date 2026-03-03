// ─── Model Tier Routing ─────────────────────────────────────────
export enum ModelTier {
  /** Sonnet — complex generation (roadmaps, narratives) */
  QUALITY = 'quality',
  /** Haiku — medium tasks (quests, assessments) */
  BALANCED = 'balanced',
  /** Haiku — simple/batch tasks */
  BUDGET = 'budget',
  /** No LLM — template-based fallback */
  TEMPLATE = 'template',
}

export interface ModelTierDefinition {
  primary: string;
  fallbacks: string[];
}

export const MODEL_TIER_DEFINITIONS: Record<
  Exclude<ModelTier, ModelTier.TEMPLATE>,
  ModelTierDefinition
> = {
  [ModelTier.QUALITY]: {
    primary: 'claude-sonnet-4-6',
    fallbacks: ['claude-haiku-4-5-20251001'],
  },
  [ModelTier.BALANCED]: {
    primary: 'claude-haiku-4-5-20251001',
    fallbacks: ['claude-sonnet-4-6'],
  },
  [ModelTier.BUDGET]: {
    primary: 'claude-haiku-4-5-20251001',
    fallbacks: [],
  },
};

// ─── Generator Context ──────────────────────────────────────────

export interface UserProfileContext {
  userId: string;
  level: number;
  totalXp: number;
  subscriptionTier: string;
  archetypeId?: string;
  characterId?: string;
  evolutionTier?: string;
}

export interface LearningContext {
  currentStreak: number;
  longestStreak: number;
  recentCompletions: number;
  averageQualityScore: number;
  skillElos: Array<{ skillDomain: string; elo: number }>;
}

export interface CharacterContext {
  characterId: string;
  archetypeId: string;
  evolutionTier: string;
  attributes: {
    strength: number;
    intelligence: number;
    charisma: number;
    constitution: number;
    dexterity: number;
    wisdom: number;
  };
}

export interface PerformanceContext {
  averageTimeSpentRatio: number;
  completionRate: number;
  preferredTaskTypes: string[];
  difficultyDistribution: Record<string, number>;
}

export interface NarrativeContext {
  currentSeason: number;
  lastEpisodeNumber: number;
  narrativeMode: string;
}

export interface GeneratorContext {
  userProfile: UserProfileContext;
  learningContext?: LearningContext;
  characterContext?: CharacterContext;
  performanceContext?: PerformanceContext;
  narrativeContext?: NarrativeContext;
}

/** Per-generator budget: which context fields to include */
export const GENERATOR_CONTEXT_BUDGETS: Record<
  string,
  Array<keyof GeneratorContext>
> = {
  roadmap: ['userProfile', 'learningContext', 'characterContext'],
  narrative: [
    'userProfile',
    'characterContext',
    'narrativeContext',
    'performanceContext',
  ],
  quest: ['userProfile', 'learningContext', 'performanceContext'],
  assessment: ['userProfile', 'learningContext'],
  lore: ['userProfile', 'narrativeContext'],
};

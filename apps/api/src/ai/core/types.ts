// ─── LLM Provider ──────────────────────────────────────────────
export type LlmProvider = 'anthropic' | 'openai' | 'google';

// ─── Model Tier Routing ─────────────────────────────────────────
export enum ModelTier {
  /** Best model — complex generation (roadmaps, narratives) */
  QUALITY = 'quality',
  /** Mid-tier — medium tasks (quests, assessments) */
  BALANCED = 'balanced',
  /** Cheapest — simple/batch tasks */
  BUDGET = 'budget',
  /** No LLM — template-based fallback (not in PROVIDER_MODELS; handled by TemplateService) */
  TEMPLATE = 'template',
}

export interface ModelTierDefinition {
  primary: string;
  fallbacks: string[];
}

/** Provider-specific model mappings */
const PROVIDER_MODELS: Record<
  LlmProvider,
  Record<Exclude<ModelTier, ModelTier.TEMPLATE>, ModelTierDefinition>
> = {
  anthropic: {
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
  },
  openai: {
    [ModelTier.QUALITY]: {
      primary: 'gpt-4o',
      fallbacks: ['gpt-4o-mini'],
    },
    [ModelTier.BALANCED]: {
      primary: 'gpt-4o-mini',
      fallbacks: ['gpt-4o'],
    },
    [ModelTier.BUDGET]: {
      primary: 'gpt-4o-mini',
      fallbacks: [],
    },
  },
  google: {
    [ModelTier.QUALITY]: {
      primary: 'gemini-2.0-flash',
      fallbacks: ['gemini-2.0-flash-lite'],
    },
    [ModelTier.BALANCED]: {
      primary: 'gemini-2.0-flash-lite',
      fallbacks: ['gemini-2.0-flash'],
    },
    [ModelTier.BUDGET]: {
      primary: 'gemini-2.0-flash-lite',
      fallbacks: [],
    },
  },
};

/** Get model definitions for a given provider */
export function getModelTierDefinitions(
  provider: LlmProvider,
): Record<Exclude<ModelTier, ModelTier.TEMPLATE>, ModelTierDefinition> {
  return PROVIDER_MODELS[provider];
}

/**
 * @deprecated Use getModelTierDefinitions(provider) instead.
 * Kept for backward compatibility — returns Anthropic models.
 */
export const MODEL_TIER_DEFINITIONS = PROVIDER_MODELS.anthropic;

// ─── L0: Domain Model (static / slow-changing reference data) ───

export interface DomainModelContext {
  bloomLevels: readonly string[];
  archetypeBlueprint?: {
    archetypeId: string;
    questMix: { knowledge: number; practice: number; creative: number; boss: number };
    preferredBloomLevels: string[];
    motivationalStyle: string;
    narrativeTone: string;
  };
}

// ─── L1: Learner Profile (slow-changing per-user data) ──────────

export interface LearnerProfileContext {
  // User data
  userId: string;
  level: number;
  totalXp: number;
  subscriptionTier: string;
  locale: string;
  archetypeId?: string;
  characterId?: string;
  evolutionTier?: string;
  // Character attributes
  characterAttributes?: {
    strength: number;
    intelligence: number;
    charisma: number;
    constitution: number;
    dexterity: number;
    wisdom: number;
  };
  // Learning metrics
  currentStreak: number;
  longestStreak: number;
  recentCompletions: number;
  averageQualityScore: number;
  skillElos: Array<{ skillDomain: string; elo: number; assessmentCount: number }>;
  // Performance metrics
  averageTimeSpentRatio: number;
  preferredTaskTypes: string[];
  difficultyDistribution: Record<string, number>;
  // Onboarding data
  dreamGoal?: string;
  interests?: string[];
  careerTarget?: string;
  domain?: string;
  // Review item aggregates
  dueReviewCount: number;
  masteryDistribution: Record<string, number>;
}

// ─── L2: Roadmap Context (Phase 2) ─────────────────────────────

export interface RoadmapContextSummary {
  roadmapId: string;
  title: string;
  goal: string;
  dailyMinutes: number;
  durationDays: number;
  progress: number;
  status: string;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    order: number;
    totalTasks: number;
    completedTasks: number;
    skillDomains: string[];
  }>;
  onboardingAssessments?: Array<{ domain: string; level: string; score: number }>;
}

// ─── L3: Quest Session (Phase 3) ───────────────────────────────

export interface QuestSessionContext {
  taskId: string;
  taskTitle: string;
  taskType: string;
  questType: string;
  skillDomain: string | null;
  bloomLevel: string | null;
  difficultyTier: number;
  knowledgeCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  attempts: Array<{
    attemptNumber: number;
    selectedIndex?: number;
    correct?: boolean;
    timeSpentSeconds?: number;
    hintsRequested: number;
  }>;
  hintsRequestedTotal: number;
  totalTimeSpentSeconds: number;
}

// ─── L4: Ledger Context (Phase 4) ──────────────────────────────

export interface LedgerContext {
  insights: Array<{
    insightType: string;
    skillDomain: string | null;
    title: string;
    description: string;
    confidence: number;
  }>;
}

// ─── Narrative Context ──────────────────────────────────────────

export interface NarrativeContext {
  currentSeason: number;
  lastEpisodeNumber: number;
  narrativeMode: string;
}

// ─── Generator Context (5-layer model) ─────────────────────────

export interface GeneratorContext {
  domainModel: DomainModelContext;              // L0: always present
  learnerProfile: LearnerProfileContext;        // L1: always present
  roadmapContext?: RoadmapContextSummary;       // L2
  questSession?: QuestSessionContext;           // L3
  ledgerContext?: LedgerContext;                // L4
  narrativeContext?: NarrativeContext;           // narrative-specific
}

/** Extra context layers a generator needs beyond L0+L1 (which are always loaded) */
export type ContextLayer = 'roadmapContext' | 'questSession' | 'ledgerContext' | 'narrativeContext';

/** Per-generator budget: which extra context layers to include */
export const GENERATOR_CONTEXT_BUDGETS: Record<string, ContextLayer[]> = {
  roadmap:                ['roadmapContext'],
  narrative:              ['narrativeContext'],
  quest:                  ['roadmapContext', 'ledgerContext'],
  assessment:             ['roadmapContext', 'ledgerContext'],
  'code-challenge':       ['roadmapContext'],
  quiz:                   ['roadmapContext'],
  recommendation:         ['roadmapContext', 'ledgerContext'],
  motivational:           [],
  'fun-fact':             [],
  resource:               ['roadmapContext'],
  'milestone-suggestion': [],
  'onboarding-assessment': [],
  'interest-suggestion':  [],
  'quest-assistant':      ['questSession', 'roadmapContext', 'ledgerContext'],
  'domain-classifier':    [],
  'article-body':         ['roadmapContext'],
  'exercise':             ['roadmapContext'],
};

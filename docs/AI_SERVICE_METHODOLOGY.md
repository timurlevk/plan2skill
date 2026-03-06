# Plan2Skill AI Service — Architecture & Methodology v2

**Status:** DESIGN PHASE — Architecture Complete, Implementation Pending
**Based on:** ai-orchestrator audit + deep market research (EdTech AI, gamification, personalization)
**Stack:** NestJS + TypeScript + Anthropic SDK + Zod
**Last updated:** 2026-03-03

---

## TABLE OF CONTENTS

1. [Current State Analysis](#1-current-state-analysis)
2. [Gap Analysis — 26 Identified Gaps](#2-gap-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Core Patterns](#4-core-patterns)
5. [Generator Specifications (10 Generators)](#5-generator-specifications)
6. [EdTech AI Patterns](#6-edtech-ai-patterns)
7. [Narrative AI Engine](#7-narrative-ai-engine)
8. [Personalization & Adaptive Difficulty](#8-personalization--adaptive-difficulty)
9. [Content Safety Framework](#9-content-safety-framework)
10. [Prompt Engineering Rules](#10-prompt-engineering-rules)
11. [Base Generator Contract](#11-base-generator-contract)
12. [LLM Tracing & Cost Tracking](#12-llm-tracing--cost-tracking)
13. [Caching & Cost Optimization](#13-caching--cost-optimization)
14. [Implementation Phases](#14-implementation-phases)
15. [Key Principles](#15-key-principles)

---

## 1. CURRENT STATE ANALYSIS

### 1.1 What Exists (`apps/api/src/ai/ai.service.ts`)

```
AiService (129 lines)
├── client: Anthropic (hardcoded claude-sonnet-4-6)
├── generateRoadmap(input) → raw JSON.parse, no Zod, no retry
└── generateJSON<T>(system, user, maxTokens) → generic, no validation, no tracing
```

### 1.2 Services That Call AI

| Service | Method | AI Call | Issues |
|---------|--------|---------|--------|
| `RoadmapService` | `generateWithAi()` | `AiService.generateRoadmap()` | No retry, no validation, fire-and-forget |
| `NarrativeService` | `generateEpisodeBatch()` | `AiService.generateJSON()` | Sequential loop (N calls), no admin guard |
| `QuestService` | — | None | Pure deterministic, no AI content |
| `ProgressionService` | — | None | XP/level math only |

### 1.3 Critical Gaps Summary

- **No output validation** — raw `JSON.parse(text) as T` everywhere
- **No error handling/retries** — single call, crash on failure
- **No LLM tracing** — zero cost/token/quality visibility
- **Hardcoded single model** — Sonnet for everything, no tiering
- **No context enrichment** — learner profile not passed to generators
- **No adaptive difficulty** — all users get identical content
- **No quest AI** — quests are task-pointers, not generated content
- **No assessment generation** — only self-assessment exists
- **No content safety** — no filtering on AI outputs
- **No caching** — every call is fresh, even for shared content
- **No cron jobs** — energy recharge, episode publishing are manual

---

## 2. GAP ANALYSIS

### 2.1 Priority Matrix

26 gaps identified across 5 categories. Priority based on user impact + implementation dependency.

#### P0 — BLOCKERS (Must fix before any new generators)

| ID | Gap | Current State | Solution |
|----|-----|---------------|----------|
| GAP-QA-01 | No output validation | `JSON.parse() as T` | Zod schemas for all AI outputs |
| GAP-AR-01 | No LLM tracing | Zero observability | `LlmUsage` + `LlmTrace` Prisma models |
| GAP-AR-02 | No cost tracking | No idea what AI costs | Cost estimation per call in tracer |
| GAP-AR-04 | No error handling | Single call, crash on fail | Retry (2x) → fallback model → cache → template |
| GAP-CG-01 | No quiz generation | `knowledgeCheck` is static seed data | AI quiz generator with Bloom's taxonomy |
| GAP-CG-02 | No dynamic quest content | Quests = pointers to existing tasks | Quest content generator with personalization |
| GAP-PZ-01 | No adaptive difficulty | All users get same content | Elo-based skill estimation + ZPD targeting |

#### P1 — HIGH (Enable personalization + core features)

| ID | Gap | Solution |
|----|-----|----------|
| GAP-AR-03 | No model tiering | Sonnet (roadmaps) / Haiku (everything else) |
| GAP-AR-05 | No caching layer | Semantic cache + cohort cache for shared content |
| GAP-AR-06 | No rate limiting per user | Token budget per user per day by subscription tier |
| GAP-CE-01 | No context enrichment | Per-generator context budgets from user profile |
| GAP-CE-02 | Monolithic AiService | BaseGenerator pattern with 10 typed generators |
| GAP-NR-01 | Narrative not personalized | Character-aware episode generation with SCORE |
| GAP-NR-02 | No assessment generation | Bloom's taxonomy question generator |
| GAP-NR-03 | Roadmap regen is stubbed | `regenRemainingTasks()` has TODO, never calls AI |
| GAP-NR-04 | Episode publish pipeline missing | `reviewed` → `published` has no automation |
| GAP-PZ-02 | No character-aware content | Character archetype doesn't influence quests/narrative |
| GAP-PZ-03 | No learning pace adaptation | Static pacing regardless of user speed |
| GAP-PZ-04 | No "what's next" recommendations | `WhatsNextOption` type exists but no AI behind it |

#### P2 — MEDIUM (Content enrichment + engagement)

| ID | Gap | Solution |
|----|-----|----------|
| GAP-CG-03 | No fun facts / micro-content | Fun fact generator (Haiku, cached, batch) |
| GAP-CG-04 | No resource recommendations | Curated + AI-generated resource suggestions |
| GAP-CG-05 | No fact-checking pipeline | RAG against knowledge base for claim verification |
| GAP-CG-06 | No streak motivational messaging | Personalized streak messages by archetype |
| GAP-CG-07 | No AI tutor / explain mode | Contextual explanations for quiz wrong answers |
| GAP-CG-08 | No smart review content | AI-enhanced spaced repetition prompts |
| GAP-CG-09 | No code challenges | Code challenge generator for tech roadmaps |
| GAP-UC-01 | No NL goal parsing | Natural language → structured goal extraction |
| GAP-UC-02 | No weekly challenge generation | AI-generated weekly themes and challenges |

#### P3 — LOW (Optimization + polish)

| ID | Gap | Solution |
|----|-----|----------|
| GAP-UC-03 | No A/B testing for prompts | Prompt variant tracking in `LlmTrace` |
| GAP-UC-04 | No celebration messages | Personalized milestone completion messages |

---

## 3. TARGET ARCHITECTURE

### 3.1 Generator Hierarchy (10 generators)

```
                    ┌─────────────────────┐
                    │   BaseGenerator<T>  │ abstract
                    │   ─────────────────│
                    │   generatorType    │
                    │   modelTier        │
                    │   temperature      │
                    │   outputSchema: Zod│
                    │   generate()       │
                    │   validate()       │
                    │   enrichContext()  │
                    │   trackUsage()    │
                    └─────────┬─────────┘
                              │
    ┌────────┬────────┬───────┼───────┬──────────┬──────────┐
    │        │        │       │       │          │          │
 Roadmap  Narrat-  Quest   Assess- Recommend- Fun-Fact  Resource
Generator  ive    Designer  ment    ation     Generator  Curator
           Writer          Creator  Engine
    │        │        │       │       │          │          │
    │     ┌──┘        │       │       │          │          │
    │   Episode    ┌──┘       │       │          │          │
    │   Sage-     Weekly    Quiz    What's-   Streak    Code-
    │   Reflect  Challenge  Gen     Next      Message  Challenge
    │             │
    │          Motivational
    │          Message
    └──────────────────────────────────────────────────────────
```

### 3.2 Service Layer (File Structure)

```
apps/api/src/ai/
├── ai.module.ts                    # NestJS module — registers all generators
├── ai.service.ts                   # DEPRECATED → replaced by generators
│
├── core/
│   ├── base-generator.ts           # Abstract base class
│   ├── llm-client.ts               # Multi-model client, retry, timeout
│   ├── llm-tracer.ts               # Usage + full trace tracking
│   ├── context-enrichment.service.ts  # User context builder
│   ├── content-safety.service.ts   # Input/output filtering
│   ├── cache.service.ts            # Semantic + cohort caching
│   └── prompt-registry.ts          # Versioned prompt templates
│
├── generators/
│   ├── roadmap.generator.ts        # Personalized roadmap (Sonnet, 0.3)
│   ├── narrative.generator.ts      # Episodes + sage reflection (Haiku, 0.7)
│   ├── quest.generator.ts          # Daily quest content (Haiku, 0.5)
│   ├── assessment.generator.ts     # Bloom's taxonomy questions (Haiku, 0.3)
│   ├── recommendation.generator.ts # What's-next suggestions (Haiku, 0.5)
│   ├── fun-fact.generator.ts       # Micro-content: facts, tips (Haiku, 0.6)
│   ├── resource.generator.ts       # Learning resource curation (Haiku, 0.4)
│   ├── motivational.generator.ts   # Streak/milestone messages (Haiku, 0.7)
│   ├── code-challenge.generator.ts # Code challenges for tech tracks (Haiku, 0.5)
│   └── quiz.generator.ts           # Knowledge check questions (Haiku, 0.3)
│
└── schemas/
    ├── roadmap.schema.ts           # AiRoadmapSchema, AiMilestoneSchema, AiTaskSchema
    ├── narrative.schema.ts         # AiEpisodeSchema, AiSageReflectionSchema
    ├── quest.schema.ts             # AiQuestBatchSchema, AiQuestSchema
    ├── assessment.schema.ts        # AiAssessmentSchema, AiQuestionSchema
    ├── recommendation.schema.ts    # AiRecommendationSchema
    ├── fun-fact.schema.ts          # AiFunFactBatchSchema
    ├── quiz.schema.ts              # AiQuizQuestionSchema with distractors
    └── shared.schema.ts            # Shared enums, Bloom's levels, difficulty tiers
```

### 3.3 Data Flow

```
Client Request
    │
    ▼
tRPC Router (auth + input Zod validation)
    │
    ▼
Domain Service (RoadmapService, QuestService, etc.)
    │
    ▼
Generator.generate(input, context)
    │
    ├─→ ContextEnrichmentService.build(userId, generatorType)
    │       └─→ DB queries for user profile, learning history, character
    │
    ├─→ ContentSafetyService.filterInput(userPrompt)
    │
    ├─→ CacheService.get(cacheKey)  ──→ HIT? Return cached
    │
    ├─→ LlmClient.call(model, messages, options)
    │       ├─→ Retry (2x exponential backoff)
    │       ├─→ Fallback model (if tier has fallback)
    │       └─→ Template fallback (if AI fails completely)
    │
    ├─→ Zod schema.parse(JSON.parse(response))
    │
    ├─→ ContentSafetyService.filterOutput(result)
    │
    ├─→ CacheService.set(cacheKey, result, ttl)
    │
    ├─→ LlmTracer.track(usage + optional full trace)
    │
    └─→ Return validated result
```

---

## 4. CORE PATTERNS

### 4.1 Structured Output with Zod

**Problem:** Current `JSON.parse(text) as T` has zero validation. LLM can return malformed JSON, missing fields, wrong types — all pass silently.

**Solution:** Every generator defines a Zod schema. Output is parsed AND validated.

```typescript
// schemas/roadmap.schema.ts
import { z } from 'zod';

export const AiTaskSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(500),
  taskType: z.enum(['video', 'article', 'quiz', 'project', 'review', 'boss']),
  estimatedMinutes: z.number().int().min(5).max(120),
  xpReward: z.number().int().min(10).max(500),
  coinReward: z.number().int().min(1).max(50),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  skillDomain: z.string().max(50).optional(),
  knowledgeCheck: z.object({
    question: z.string().min(10),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(10).max(300),
    bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze']).optional(),
  }).optional(),
});

export const AiMilestoneSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(300),
  weekStart: z.number().int().min(1),
  weekEnd: z.number().int().min(1),
  tasks: z.array(AiTaskSchema).min(5).max(20),
});

export const AiRoadmapSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(300),
  milestones: z.array(AiMilestoneSchema).min(4).max(10),
});
```

### 4.2 Discriminated Union Pattern

**Problem (Pink Elephant):** Prompts like "don't generate a boss quest unless the milestone is final" cause the LLM to generate boss quests MORE often. Negative instructions backfire.

**Solution:** Force LLM to choose an action type FIRST via `z.discriminatedUnion`.

```typescript
const NoBossNeeded = z.object({
  action: z.literal('standard_tasks'),
  reason: z.string().min(10),
  tasks: z.array(AiTaskSchema),
});

const BossRequired = z.object({
  action: z.literal('include_boss'),
  rationale: z.string().min(10),
  tasks: z.array(AiTaskSchema),
  bossTask: AiTaskSchema,
});

const MilestoneDecision = z.discriminatedUnion('action', [NoBossNeeded, BossRequired]);
```

**Prompt pattern:**
```
Choose ONE action:

**ACTION 1: "standard_tasks"** (USE THIS FOR MOST MILESTONES ~85%)
Choose when the milestone is an intermediate learning phase.

**ACTION 2: "include_boss"** (USE THIS ONLY FOR CAPSTONE MILESTONES ~15%)
Choose when this milestone is the final phase or represents a major skill checkpoint.

=== DECISION ===
Choose your action now. If in doubt, choose "standard_tasks".
```

**Where to apply in Plan2Skill:**
- Quest generation: standard vs boss quest
- Narrative: new episode needed vs recap sufficient
- Assessment: follow-up question vs assessment complete
- Recommendation: suggest new topic vs deepen current

### 4.3 Tiered Model Routing

| Tier | Model | Cost (1M tokens in/out) | Use Cases |
|------|-------|-------------------------|-----------|
| 1 — Quality | claude-sonnet-4-6 | $3/$15 | Roadmap generation (runs once, high stakes) |
| 2 — Balanced | claude-haiku-4-5 | $0.80/$4 | Assessment questions, narrative episodes |
| 3 — Budget | claude-haiku-4-5 | $0.80/$4 | Quests, recommendations, fun facts, messages |
| 4 — Template | — (no LLM) | $0 | Template-based quests, cached responses, streak messages |

```typescript
export enum ModelTier {
  QUALITY = 1,
  BALANCED = 2,
  BUDGET = 3,
  TEMPLATE = 4,
}

const TIER_MODELS: Record<ModelTier, string[]> = {
  [ModelTier.QUALITY]:  ['claude-sonnet-4-6'],
  [ModelTier.BALANCED]: ['claude-haiku-4-5', 'claude-sonnet-4-6'],  // fallback
  [ModelTier.BUDGET]:   ['claude-haiku-4-5'],
  [ModelTier.TEMPLATE]: [],
};
```

### 4.4 Context Enrichment (Per-Generator Budgets)

**Principle (from ai-orchestrator):** Each generator receives only the context it needs. Prevents token bloat, improves output quality.

```typescript
interface GeneratorContext {
  userProfile: {
    displayName: string;
    level: number;
    totalXp: number;
    subscriptionTier: string;
    currentStreak: number;
  };
  learningContext: {
    goals: string[];
    experienceLevel: string;
    dailyMinutes: number;
    completedTaskCount: number;
    masteredSkills: string[];
    currentMilestoneProgress: number;  // 0-100%
    skillElo: Record<string, number>;  // skill domain → Elo rating
  };
  characterContext: {
    archetypeId: string;        // strategist, explorer, connector, builder, innovator
    evolutionTier: string;
    companionId: string | null;
  };
  narrativeContext?: {
    currentSeason: number;
    lastEpisodeNumber: number;
    narrativeMode: string;
    recentEpisodeSummaries: string[];  // last 3 for continuity
    storyBibleSnapshot: string;        // compressed world state
  };
  performanceContext?: {
    avgSessionMinutes: number;
    quizAccuracyRate: number;          // 0-1
    taskCompletionRate: number;        // 0-1
    preferredTaskTypes: string[];      // top 3 by engagement
    struggleAreas: string[];           // skills with low Elo
  };
}

// Generator → allowed context fields
const CONTEXT_BUDGETS: Record<string, (keyof GeneratorContext)[]> = {
  'roadmap':        ['userProfile', 'learningContext'],
  'narrative':      ['userProfile', 'characterContext', 'narrativeContext'],
  'quest':          ['userProfile', 'learningContext', 'characterContext', 'performanceContext'],
  'assessment':     ['learningContext', 'performanceContext'],
  'recommendation': ['userProfile', 'learningContext', 'performanceContext'],
  'fun-fact':       ['learningContext'],
  'resource':       ['learningContext', 'performanceContext'],
  'motivational':   ['userProfile', 'characterContext', 'performanceContext'],
  'quiz':           ['learningContext', 'performanceContext'],
  'code-challenge': ['learningContext', 'performanceContext'],
};
```

### 4.5 Error Handling & Retry Strategy

```typescript
async function callLlm(options: LlmCallOptions): Promise<LlmResponse> {
  const { maxRetries = 2, timeoutMs = 30_000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await Promise.race([
        client.messages.create({ ... }),
        timeout(timeoutMs),
      ]);
      return { text: extractText(response), usage: response.usage };
    } catch (error) {
      if (!isRetriable(error) || attempt === maxRetries) throw error;
      await sleep(1000 * Math.pow(2, attempt));  // 1s, 2s, 4s
    }
  }
  throw new Error('All retry attempts exhausted');
}
```

**Graceful degradation chain:**
```
LLM Call (primary model)
  → Retry (up to 2x with exponential backoff)
    → Fallback model (if tier has one — e.g., Haiku → Sonnet)
      → Cached response (if available for this generator + similar input)
        → Template response (deterministic, no AI)
          → User-friendly error: "try again later"
```

---

## 5. GENERATOR SPECIFICATIONS (10 Generators)

### 5.1 RoadmapGenerator

| Field | Value |
|-------|-------|
| **Trigger** | User clicks "Generate Roadmap" after onboarding |
| **Tier** | 1 (Quality — Sonnet) |
| **Temperature** | 0.3 |
| **Context** | `userProfile` + `learningContext` |
| **Token budget** | ~5K input, ~4K output |
| **Caching** | None (unique per user) |
| **Schema** | `AiRoadmapSchema` (milestones with tasks + knowledgeCheck) |

**Improvements over current:**
- Zod validation replaces `JSON.parse() as T`
- Knowledge checks generated inline (Bloom's remember/understand for early milestones, apply/analyze for later)
- Skill domain tagging per task for spaced-repetition seeding
- Rarity distribution enforcement via prompt + schema constraints

### 5.2 NarrativeGenerator

| Field | Value |
|-------|-------|
| **Trigger** | Admin "Generate Batch" or future cron |
| **Tier** | 2 (Balanced — Haiku with Sonnet fallback) |
| **Temperature** | 0.7 |
| **Context** | `userProfile` + `characterContext` + `narrativeContext` |
| **Token budget** | ~2K input, ~1.5K output per episode |
| **Caching** | Cohort cache — same episodes served to users in same season |
| **Schema** | `AiEpisodeSchema` |

**Key patterns (from SCORE research):**

```typescript
export const AiEpisodeSchema = z.object({
  title: z.string().min(5).max(80),
  contextSentence: z.string().min(10).max(150),
  body: z.string().min(200).max(800),           // 80-250 words enforced
  cliffhanger: z.string().min(20).max(200),
  sageReflection: z.string().min(30).max(300),
  summary: z.string().min(20).max(200),          // For context window of next episode
  category: z.enum(['standard', 'climax', 'lore_drop', 'character_focus', 'season_finale']),
  toneProfile: z.enum(['inspiring', 'dramatic', 'humorous', 'calm']),
  continuityCheck: z.object({
    referencedCharacters: z.array(z.string()),
    referencedLocations: z.array(z.string()),
    plotThreadsAdvanced: z.array(z.string()),
  }),
});
```

**SCORE coherence system (adapted):**
- Story Bible injected as compressed context (~500 tokens: worldName, characters, geography, rules)
- Last 3 episode summaries for continuity (~150 tokens)
- Character blueprint per archetype influences tone
- Cliffhanger templates: revelation, choice, danger, mystery, transformation

### 5.3 QuestGenerator

| Field | Value |
|-------|-------|
| **Trigger** | Daily allocation when user opens app / cron |
| **Tier** | 3 (Budget — Haiku) |
| **Temperature** | 0.5 |
| **Context** | `userProfile` + `learningContext` + `characterContext` + `performanceContext` |
| **Token budget** | ~1K input, ~800 output |
| **Caching** | Cohort cache by skill domain + difficulty tier |
| **Schema** | `AiQuestBatchSchema` |

```typescript
export const AiQuestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(15).max(300),
  questType: z.enum(['knowledge', 'physical', 'creative', 'habit', 'social', 'reflection']),
  taskType: z.enum(['video', 'article', 'quiz', 'project', 'review', 'boss']),
  estimatedMinutes: z.number().int().min(5).max(60),
  difficulty: z.number().int().min(1).max(5),    // Maps to Elo range
  xpReward: z.number().int().min(10).max(200),
  skillDomain: z.string().max(50),
  knowledgeCheck: AiKnowledgeCheckSchema.optional(),
  archetypeBonus: z.string().max(50).optional(), // "Builder: +25% XP for project tasks"
});

export const AiQuestBatchSchema = z.object({
  quests: z.array(AiQuestSchema).min(3).max(8),
  mixRationale: z.string().max(200),             // Why this mix was chosen
});
```

**Flow state distribution (from DDA research):**
- 70% stretch zone (slightly above current skill — Elo +50 to +150)
- 20% mastery reinforcement (at or below current skill — Elo -50 to 0)
- 10% review (previously mastered content — lowest Elo skills)

### 5.4 AssessmentGenerator (Bloom's Taxonomy)

| Field | Value |
|-------|-------|
| **Trigger** | Onboarding skill check, periodic assessment, milestone gate |
| **Tier** | 2 (Balanced — Haiku with Sonnet fallback) |
| **Temperature** | 0.3 |
| **Context** | `learningContext` + `performanceContext` |
| **Token budget** | ~1.5K input, ~2K output |
| **Caching** | Question bank cache by domain + difficulty |
| **Schema** | `AiAssessmentSchema` |

```typescript
export const AiQuestionSchema = z.object({
  question: z.string().min(15).max(500),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
  options: z.array(z.object({
    text: z.string().min(1).max(200),
    isCorrect: z.boolean(),
    distractorType: z.enum(['common_misconception', 'partial_truth', 'related_concept', 'plausible_wrong']).optional(),
  })).length(4),
  explanation: z.string().min(20).max(400),
  difficulty: z.number().int().min(1).max(5),
  skillDomain: z.string().max(50),
  estimatedSeconds: z.number().int().min(15).max(180),
});

export const AiAssessmentSchema = z.object({
  questions: z.array(AiQuestionSchema).min(3).max(10),
  bloomDistribution: z.object({
    remember: z.number().int(),
    understand: z.number().int(),
    apply: z.number().int(),
    analyze: z.number().int(),
  }),
  targetDifficulty: z.number().min(1).max(5),
});
```

**Bloom's distribution by assessment type:**
- Onboarding: 40% remember, 30% understand, 20% apply, 10% analyze
- Milestone gate: 20% remember, 30% understand, 30% apply, 20% analyze
- Mastery check: 10% understand, 30% apply, 40% analyze, 20% evaluate

**Distractor generation (from DPO research):**
- Each wrong option tagged with `distractorType`
- Common misconception: the most frequent wrong answer for this domain
- Partial truth: correct concept applied incorrectly
- Related concept: correct but answers a different question
- Plausible wrong: syntactically/structurally similar to correct answer

### 5.5 RecommendationEngine

| Field | Value |
|-------|-------|
| **Trigger** | Home page load, after task completion |
| **Tier** | 3 (Budget — Haiku) |
| **Temperature** | 0.5 |
| **Context** | `userProfile` + `learningContext` + `performanceContext` |
| **Token budget** | ~800 input, ~500 output |
| **Caching** | 1-hour TTL per user (invalidated on task completion) |
| **Schema** | `AiRecommendationSchema` |

```typescript
export const AiRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    type: z.enum(['next_task', 'skill_gap', 'explore_topic', 'review_session', 'take_break']),
    title: z.string().min(5).max(100),
    reason: z.string().min(10).max(200),
    priority: z.number().int().min(1).max(5),
    actionUrl: z.string().max(200).optional(),
  })).min(2).max(5),
});
```

### 5.6 FunFactGenerator

| Field | Value |
|-------|-------|
| **Trigger** | Daily content pool refresh (batch of 10-20) |
| **Tier** | 3 (Budget — Haiku) |
| **Temperature** | 0.6 |
| **Context** | `learningContext` (skill domains only) |
| **Token budget** | ~500 input, ~600 output |
| **Caching** | Global cache, 24h TTL, served to all users in same domain |

```typescript
export const AiFunFactBatchSchema = z.object({
  facts: z.array(z.object({
    text: z.string().min(20).max(280),      // Tweet-length
    domain: z.string().max(50),
    category: z.enum(['history', 'surprising', 'practical', 'famous_quote', 'analogy']),
    source: z.string().max(200).optional(),  // For fact-checking
  })).min(5).max(20),
});
```

### 5.7 ResourceGenerator

| Field | Value |
|-------|-------|
| **Trigger** | Task completion (suggest related resources) |
| **Tier** | 3 (Budget — Haiku) |
| **Temperature** | 0.4 |
| **Context** | `learningContext` + `performanceContext` |
| **Caching** | Per-domain cache, 7-day TTL |

### 5.8 MotivationalGenerator

| Field | Value |
|-------|-------|
| **Trigger** | Streak milestones (7, 14, 30, 60, 100 days), level-ups, milestone completion |
| **Tier** | 3 (Budget — Haiku) or 4 (Template for common cases) |
| **Temperature** | 0.7 |
| **Context** | `userProfile` + `characterContext` + `performanceContext` |
| **Token budget** | ~300 input, ~200 output |
| **Caching** | Template library for common milestones, AI for custom |

**Template vs AI decision:**
- Streaks ≤30 days → template (pre-written, archetype-flavored)
- Streaks >30 days or unusual achievements → AI-generated
- Level-ups divisible by 5 → AI-generated celebration
- Other level-ups → template

### 5.9 QuizGenerator (Knowledge Checks)

| Field | Value |
|-------|-------|
| **Trigger** | Task creation within roadmap, quest completion validation |
| **Tier** | 3 (Budget — Haiku) |
| **Temperature** | 0.3 |
| **Context** | `learningContext` + `performanceContext` |
| **Token budget** | ~600 input, ~500 output |
| **Caching** | Question bank per skill domain, reused across users |

### 5.10 CodeChallengeGenerator

| Field | Value |
|-------|-------|
| **Trigger** | Tech-focused roadmaps, "boss" type tasks |
| **Tier** | 2 (Balanced — Haiku with Sonnet fallback for complex challenges) |
| **Temperature** | 0.5 |
| **Context** | `learningContext` + `performanceContext` |
| **Token budget** | ~1K input, ~1.5K output |
| **Caching** | Per-language + difficulty tier, 7-day TTL |

```typescript
export const AiCodeChallengeSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(500),
  language: z.string().max(30),
  starterCode: z.string().max(1000),
  expectedOutput: z.string().max(500),
  hints: z.array(z.string().max(200)).max(3),
  difficulty: z.number().int().min(1).max(5),
  concepts: z.array(z.string().max(50)).min(1).max(5),
});
```

---

## 6. EDTECH AI PATTERNS

### 6.1 Bloom's Taxonomy Integration

All question-generating generators (assessment, quiz, knowledge check) use Bloom's taxonomy levels:

| Level | Verb Examples | Plan2Skill Mapping |
|-------|---------------|-------------------|
| Remember | Define, list, recall | Early milestone tasks, onboarding assessment |
| Understand | Explain, describe, paraphrase | Video/article comprehension checks |
| Apply | Use, implement, solve | Project tasks, code challenges |
| Analyze | Compare, distinguish, examine | Mid-to-late milestone gates |
| Evaluate | Judge, critique, justify | Mastery checks, boss tasks |
| Create | Design, construct, produce | Capstone projects (not AI-assessed) |

**Prompt pattern for Bloom's-aware generation:**
```
Generate {count} questions for the skill domain "{domain}".

BLOOM'S DISTRIBUTION:
- Remember (define/recall): {n1} questions
- Understand (explain/describe): {n2} questions
- Apply (use/implement): {n3} questions
- Analyze (compare/distinguish): {n4} questions

Each question MUST include a "bloomLevel" field matching the taxonomy level.
For each wrong option, tag its distractorType.
```

### 6.2 Spaced Repetition Enhancement (FSRS-Compatible)

Current `ReviewItem` model uses SM-2. AI enhances spaced repetition by:

1. **Generating review prompts** — instead of "Review: React Hooks", generate a contextual question: "In your last project, you used useState. What would happen if you called setState inside a useEffect without a dependency array?"
2. **Adaptive difficulty** — FSRS stability scores inform which review items need harder vs easier prompts
3. **Skill domain linking** — review items linked to Elo-tracked skill domains for accurate difficulty targeting

### 6.3 Knowledge Graph Learning Paths (Future — P2)

```
Goal: "Learn React"
    │
    ├─ prerequisite: JavaScript Fundamentals (Elo: 1400)
    │     ├─ Variables & Types (Elo: 1500 — mastered)
    │     ├─ Functions & Closures (Elo: 1350 — intermediate)
    │     └─ DOM Manipulation (Elo: 1200 — needs work)
    │
    ├─ core: React Fundamentals (Elo: 1100)
    │     ├─ JSX (Elo: 1150)
    │     ├─ Components (Elo: 1050)
    │     └─ Props & State (Elo: 950 — weak)
    │
    └─ advanced: React Patterns (locked until core > 1300)
          ├─ Custom Hooks
          ├─ Context API
          └─ Performance Optimization
```

The AI roadmap generator can use this graph structure to:
- Identify prerequisites that need strengthening before advancing
- Suggest review sessions for weak prerequisite skills
- Unlock advanced topics only when core skills reach threshold Elo

---

## 7. NARRATIVE AI ENGINE

### 7.1 SCORE Coherence System (Adapted)

**S**tory Bible → **C**ontinuity Tracking → **O**utput Constraints → **R**eview Pipeline → **E**valuation

**Story Bible injection (already exists in DB as `StoryBible` model):**
- Compressed to ~500 tokens for context window
- Fields: worldName, worldRules, characters (array), geography, narrativeTone

**Continuity tracking:**
- Last 3 episode summaries passed as context (~150 tokens total)
- `continuityCheck` field in schema validates referenced characters/locations exist in Story Bible
- Post-generation check: flag episodes that reference characters not in the Bible

**Output constraints in schema:**
- Word count: 80-250 words (already enforced by NarrativeService, now also in Zod)
- Category distribution per season: ~60% standard, 15% character_focus, 10% lore_drop, 10% climax, 5% season_finale
- Tone profile must match archetype (Explorer → inspiring/dramatic, Builder → practical/calm)

### 7.2 Character Blueprint System

Each archetype has a character blueprint that influences all AI content:

```typescript
const ARCHETYPE_BLUEPRINTS: Record<string, CharacterBlueprint> = {
  strategist: {
    narrativeTone: 'analytical and decisive',
    questFlavor: 'tactical challenges with clear objectives',
    motivationalStyle: 'data-driven progress acknowledgment',
    sageVoice: 'mentor who speaks in strategic metaphors',
  },
  explorer: {
    narrativeTone: 'adventurous and curious',
    questFlavor: 'discovery-oriented missions with hidden knowledge',
    motivationalStyle: 'celebration of new territories conquered',
    sageVoice: 'wise traveler sharing tales from distant lands',
  },
  connector: {
    narrativeTone: 'warm and collaborative',
    questFlavor: 'community-building and teaching challenges',
    motivationalStyle: 'recognition of impact on others',
    sageVoice: 'empathetic guide who values relationships',
  },
  builder: {
    narrativeTone: 'practical and constructive',
    questFlavor: 'creation-focused tasks with tangible outputs',
    motivationalStyle: 'showcase of what was built',
    sageVoice: 'master craftsperson sharing workshop wisdom',
  },
  innovator: {
    narrativeTone: 'bold and experimental',
    questFlavor: 'unconventional approaches and creative solutions',
    motivationalStyle: 'highlight of unique thinking',
    sageVoice: 'visionary who challenges conventional wisdom',
  },
};
```

### 7.3 Cliffhanger Templates

Five structural cliffhanger patterns (rotated to prevent repetition):

1. **Revelation** — "But as {character} turned the final page, a hidden truth emerged..."
2. **Choice** — "Two paths lay before the hero, each demanding a different sacrifice..."
3. **Danger** — "The {threat} grew closer. Without mastery of {skill}, there would be no escape..."
4. **Mystery** — "A new symbol appeared on the map — one not found in any known text..."
5. **Transformation** — "Something stirred within — a new power, untested and wild..."

**Prompt instruction:** "Use cliffhanger pattern: {pattern}. The cliffhanger must connect to the next episode's theme: {nextTheme}."

### 7.4 Episode Publish Pipeline (Fixing GAP-NR-04)

Current gap: `reviewed` → `published` has no automation. Solution:

```
generateEpisodeBatch() → status: 'draft'
     │
     ▼
Admin review (tRPC: narrative.reviewEpisode) → status: 'reviewed'
     │
     ▼
Cron: publishScheduledEpisodes() → status: 'published'
  - Runs daily at 06:00 UTC
  - Takes oldest 'reviewed' episode
  - Sets publishedAt = now()
  - Maximum 1 episode published per day
  - Only publishes if previous episode is ≥18h old (prevents double-publish)
```

---

## 8. PERSONALIZATION & ADAPTIVE DIFFICULTY

### 8.1 Elo Rating System for Skill Estimation

**Starting point:** Every user starts every skill domain at Elo 1200.
**K factor:** Starts at 40 (high sensitivity for new learners), decays to 16 after 20 assessments.

```typescript
function updateElo(currentElo: number, assessmentCount: number, correct: boolean, questionDifficulty: number): number {
  const K = assessmentCount < 10 ? 40 : assessmentCount < 20 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (questionDifficulty - currentElo) / 400));
  const actual = correct ? 1 : 0;
  return Math.round(currentElo + K * (actual - expected));
}
```

**Elo → Difficulty tier mapping:**
| Elo Range | Tier | Label | Question Level |
|-----------|------|-------|---------------|
| < 1000 | 1 | Novice | Remember, basic Understand |
| 1000-1200 | 2 | Beginner | Understand, simple Apply |
| 1200-1400 | 3 | Intermediate | Apply, basic Analyze |
| 1400-1600 | 4 | Advanced | Analyze, Evaluate |
| > 1600 | 5 | Expert | Evaluate, Create |

### 8.2 Zone of Proximal Development (ZPD) Targeting

**Target success rate:** 70-85% (research-backed optimal learning zone)

```typescript
function calculateTargetDifficulty(skillElo: number, recentAccuracy: number): number {
  // If accuracy > 85% → push harder (increase difficulty)
  // If accuracy < 70% → ease off (decrease difficulty)
  // If 70-85% → maintain (optimal zone)
  const adjustment = recentAccuracy > 0.85 ? +100
                   : recentAccuracy < 0.70 ? -100
                   : 0;
  return skillElo + adjustment;
}
```

**Applied in generators:**
- `QuestGenerator`: difficulty tier derived from skill Elo + ZPD adjustment
- `AssessmentGenerator`: question difficulty targets ZPD for each skill domain
- `QuizGenerator`: knowledge check difficulty matches task's intended tier
- `CodeChallengeGenerator`: challenge complexity scales with Elo

### 8.3 Learner Profile Model (6 Tiers of Data Availability)

| Tier | Data Available | Content Strategy |
|------|----------------|-----------------|
| 0 — Anonymous | None | Popular/trending content, no personalization |
| 1 — New User | Goal, experience level | Basic roadmap, generic quests |
| 2 — Onboarded | + archetype, daily minutes, tools | Archetype-flavored content |
| 3 — Active (1 week) | + task completions, quiz accuracy | Elo-based difficulty, skill gaps |
| 4 — Engaged (1 month) | + streak data, session patterns | Learning pace adaptation, time-of-day optimization |
| 5 — Veteran (3+ months) | + full history, mastery levels | Highly personalized, cross-skill recommendations |

**Context enrichment adapts to tier:** Generator context includes only fields available at user's tier. Missing fields replaced with sensible defaults (e.g., Elo 1200, accuracy 0.75).

### 8.4 Flow State Distribution (Quest Mix)

Based on Dynamic Difficulty Adjustment (DDA) research:

```
Daily Quest Mix (5 quests):
├─ 3-4 Stretch Zone (Elo +50 to +150)  — New learning, slight challenge
├─ 1   Mastery Zone (Elo -50 to 0)     — Reinforcement, confidence building
└─ 0-1 Review Zone (weakest Elo skill) — Spaced repetition trigger
```

**Quest type distribution per archetype:**
| Archetype | Preferred Mix |
|-----------|--------------|
| Strategist | 40% quiz, 30% project, 20% article, 10% creative |
| Explorer | 30% article, 25% video, 25% project, 20% quiz |
| Connector | 30% social, 25% creative, 25% quiz, 20% reflection |
| Builder | 40% project, 25% quiz, 20% article, 15% creative |
| Innovator | 30% creative, 30% project, 25% quiz, 15% article |

---

## 9. CONTENT SAFETY FRAMEWORK

### 9.1 Multi-Layer Filtering

```
Layer 1: INPUT FILTER (pre-LLM)
├─ Sanitize user-provided goal/role text (strip injection attempts)
├─ Block prohibited topics (violence, hate, adult, self-harm)
└─ Length limits on all user inputs (already enforced by tRPC Zod)

Layer 2: SYSTEM PROMPT GUARDRAILS (during LLM)
├─ "NEVER generate: violence, character death, deception, real-world politics"
├─ "ALWAYS maintain: encouraging tone, age-appropriate content, factual accuracy"
└─ Already partially implemented in NarrativeService's system prompt

Layer 3: OUTPUT FILTER (post-LLM)
├─ Keyword blocklist scan on generated text
├─ Zod schema ensures structural compliance
├─ Word count / length guards
└─ Sentiment analysis (optional P2 — flag abnormally negative content)

Layer 4: HUMAN REVIEW (for narrative)
├─ Episodes: draft → reviewed → published (admin must approve)
├─ Roadmaps: no review needed (user-specific, low risk)
└─ Quests: spot-check audit via admin dashboard (future)
```

### 9.2 Prompt Injection Prevention

```typescript
function sanitizeUserInput(text: string): string {
  // Strip common injection patterns
  const stripped = text
    .replace(/```[\s\S]*?```/g, '')          // Remove code blocks
    .replace(/system:|assistant:|human:/gi, '') // Remove role markers
    .replace(/ignore previous|forget|override/gi, '') // Common injections
    .trim();

  // Hard limit: 500 chars for goals, 100 for roles
  return stripped.slice(0, 500);
}
```

### 9.3 Hallucination Reduction

- **Roadmap tasks:** Prompt includes "suggest only widely-known, verifiable resources and techniques"
- **Fun facts:** `source` field required — post-filter can flag unsourced claims for review
- **Assessment questions:** Prompt includes "only test concepts that are well-established in the {domain} field"
- **Future (P2):** RAG pipeline against curated knowledge base for fact-checking

---

## 10. PROMPT ENGINEERING RULES

### 10.1 System Prompt Template

```
You are Plan2Skill's {ROLE}. {ONE_SENTENCE_MISSION}.

## Capabilities
- {What this generator CAN do — 3-5 bullets}

## Constraints
- {What this generator MUST NOT do — positive framing}
- "When in doubt, choose the simpler option"
- "Output ONLY valid JSON matching the schema exactly"

## Output Format
- Pure JSON, no markdown fences, no explanation
- {Schema reference or inline example}

## Quality Rules
- {Domain-specific criteria — 3-5 bullets}
```

### 10.2 Temperature Guidelines

| Generation Type | Temperature | Rationale |
|-----------------|-------------|-----------|
| Classification/routing | 0.1 | Deterministic decisions |
| Assessment questions | 0.3 | Precise, unambiguous |
| Roadmap structure | 0.3 | Consistent, pedagogically sound |
| Resource recommendations | 0.4 | Relevant but varied |
| Quest generation | 0.5 | Structured but fresh |
| What's-next suggestions | 0.5 | Balanced variety |
| Fun facts | 0.6 | Engaging, surprising |
| Narrative episodes | 0.7 | Creative, engaging prose |
| Motivational messages | 0.7 | Warm, personal tone |

### 10.3 Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| "Don't generate X unless..." | Pink Elephant — LLM does X more | Discriminated Union |
| `list: Item[] = []` expecting empty | LLM rarely returns empty arrays | Explicit "no_items" action type |
| "Generate if it seems incomplete" | Vague criteria, inconsistent | Concrete trigger conditions |
| Negative instructions | LLM ignores negatives | Positive framing: "Choose X when..." |
| `JSON.parse() as T` without validation | Silent data corruption | Zod schema.parse() on every output |
| Single model for everything | Overspend on simple tasks | Tiered model routing |
| All context to all generators | Token bloat, worse output | Per-generator context budgets |
| Sequential episode generation | Slow, expensive | Batch generation (7 at once) |
| No few-shot example | Inconsistent output format | 1 compact example in critical prompts |

### 10.4 Few-Shot Examples

For critical generators (roadmap, assessment), include 1 compact example:
```
## Example Output (abbreviated — follow this structure exactly)
{
  "title": "React Mastery in 90 Days",
  "milestones": [{
    "title": "Foundations & JSX",
    "weekStart": 1, "weekEnd": 2,
    "tasks": [{ "title": "Setup dev environment", "taskType": "project", ... }]
  }]
}
```

**Rule:** Max 1 example, max 10 lines. Examples consume tokens on every call.

---

## 11. BASE GENERATOR CONTRACT

```typescript
// core/base-generator.ts

import { z } from 'zod';

export abstract class BaseGenerator<TInput, TOutput> {
  abstract readonly generatorType: string;
  abstract readonly modelTier: ModelTier;
  abstract readonly temperature: number;
  abstract readonly maxTokens: number;
  abstract readonly outputSchema: z.ZodType<TOutput>;

  constructor(
    protected readonly llmClient: LlmClient,
    protected readonly tracer: LlmTracer,
    protected readonly contextService: ContextEnrichmentService,
    protected readonly cacheService: CacheService,
    protected readonly safetyService: ContentSafetyService,
  ) {}

  abstract buildSystemPrompt(context: GeneratorContext): string;
  abstract buildUserPrompt(input: TInput, context: GeneratorContext): string;
  protected getCacheKey(input: TInput): string | null { return null; } // Override for cacheable

  async generate(userId: string, input: TInput): Promise<TOutput> {
    // 1. Build context (filtered by generator type)
    const context = await this.contextService.build(userId, this.generatorType);

    // 2. Check cache
    const cacheKey = this.getCacheKey(input);
    if (cacheKey) {
      const cached = await this.cacheService.get<TOutput>(cacheKey);
      if (cached) return cached;
    }

    // 3. Build prompts
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(input, context);

    // 4. Safety filter input
    const safeUserPrompt = this.safetyService.filterInput(userPrompt);

    // 5. Call LLM with retry + fallback
    const model = this.llmClient.resolveModel(this.modelTier);
    const startMs = Date.now();
    let rawResponse: LlmResponse;

    try {
      rawResponse = await this.llmClient.call({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: safeUserPrompt },
        ],
        maxTokens: this.maxTokens,
        temperature: this.temperature,
      });
    } catch (error) {
      await this.tracer.trackFailure({
        userId, generatorType: this.generatorType, model, error,
        systemPrompt, userPrompt: safeUserPrompt,
      });
      throw error;
    }

    const durationMs = Date.now() - startMs;

    // 6. Parse + validate with Zod
    let validated: TOutput;
    try {
      const parsed = JSON.parse(rawResponse.text);
      validated = this.outputSchema.parse(parsed);
    } catch (parseError) {
      await this.tracer.trackFailure({
        userId, generatorType: this.generatorType, model,
        error: parseError, systemPrompt, userPrompt: safeUserPrompt,
        responseText: rawResponse.text,
      });
      throw new Error(`[${this.generatorType}] Output validation failed: ${parseError}`);
    }

    // 7. Safety filter output
    this.safetyService.filterOutput(validated);

    // 8. Cache result
    if (cacheKey) {
      await this.cacheService.set(cacheKey, validated);
    }

    // 9. Track usage
    await this.tracer.trackSuccess({
      userId,
      generatorType: this.generatorType,
      model,
      purpose: this.generatorType,
      inputTokens: rawResponse.usage.inputTokens,
      outputTokens: rawResponse.usage.outputTokens,
      durationMs,
      systemPrompt,
      userPrompt: safeUserPrompt,
      responseText: rawResponse.text,
      structuredOutput: validated,
    });

    return validated;
  }
}
```

---

## 12. LLM TRACING & COST TRACKING

### 12.1 Prisma Models (Add to schema.prisma)

```prisma
model LlmUsage {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  generatorType String   @db.VarChar(30)
  model         String   @db.VarChar(50)
  purpose       String   @db.VarChar(50)
  inputTokens   Int
  outputTokens  Int
  costUsd       Decimal  @db.Decimal(10, 6)
  durationMs    Int
  success       Boolean  @default(true)
  createdAt     DateTime @default(now())

  @@index([userId, createdAt])
  @@index([generatorType, createdAt])
  @@index([createdAt])
}

model LlmTrace {
  id              String   @id @default(uuid()) @db.Uuid
  usageId         String   @db.Uuid
  systemPrompt    String   @db.Text
  userPrompt      String   @db.Text
  responseText    String?  @db.Text
  structuredOutput Json?
  errorMessage    String?  @db.Text
  createdAt       DateTime @default(now())

  usage LlmUsage @relation(fields: [usageId], references: [id])
  @@index([createdAt])
}
```

### 12.2 Cost Estimation

```typescript
const COST_TABLE: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':  { input: 3.0,  output: 15.0 },
  'claude-haiku-4-5':   { input: 0.80, output: 4.0 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_TABLE[model] ?? { input: 3.0, output: 15.0 };
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}
```

### 12.3 Admin Observability Endpoints (Future)

```
ai.usage           → Daily/monthly cost breakdown by generator
ai.traces          → Full trace viewer (prompt → response) for debugging
ai.health          → Model health status, error rates, latency percentiles
ai.costByUser      → Per-user cost tracking (abuse detection)
ai.validationRate  → Zod validation pass/fail rate per generator
```

---

## 13. CACHING & COST OPTIMIZATION

### 13.1 Cache Strategy by Generator

| Generator | Cache Type | TTL | Scope | Invalidation |
|-----------|-----------|-----|-------|-------------|
| Roadmap | None | — | Per-user unique | — |
| Narrative | Cohort | 24h | All users in same season | New episode batch |
| Quest | Cohort | 6h | Same skill domain + difficulty tier | — |
| Assessment | Question bank | 7d | Same domain + Bloom level | — |
| Recommendation | Per-user | 1h | Individual | Task completion |
| Fun Fact | Global | 24h | All users in same domain | Daily refresh |
| Resource | Per-domain | 7d | Same skill domain | — |
| Motivational | Template library | ∞ | Archetype-specific templates | Never |
| Quiz | Question bank | 7d | Same domain + difficulty | — |
| Code Challenge | Per-language | 7d | Same language + difficulty | — |

### 13.2 Template vs AI Decision Framework

```typescript
function shouldUseAi(generatorType: string, input: unknown, cacheHit: boolean): boolean {
  // Tier 4 — Always template, never AI
  if (generatorType === 'motivational' && isCommonMilestone(input)) return false;
  if (generatorType === 'streak-message' && streakDays <= 30) return false;

  // Cache hit — No AI needed
  if (cacheHit) return false;

  // User tier — Free users get more templates, premium get more AI
  // (Implement per-tier AI budget limits)

  return true;
}
```

### 13.3 Cost Projections

#### Per-User Monthly Estimates (with optimization)

| Feature | Calls/mo | Tokens/call | Model | Raw Cost | With Cache |
|---------|----------|-------------|-------|----------|-----------|
| Roadmap | 1-2 | ~5K+3K | Sonnet | $0.06 | $0.06 |
| Narrative | 30 | ~1K+1.5K | Haiku | $0.20 | $0.04 (cohort) |
| Quests | 30 | ~800+600 | Haiku | $0.10 | $0.03 (cohort) |
| Assessment | 2-4 | ~1K+1.5K | Haiku | $0.03 | $0.01 (bank) |
| Recommendations | 60 | ~500+300 | Haiku | $0.10 | $0.03 (per-user) |
| Fun Facts | 30 | ~100+100 | Haiku | $0.01 | $0.001 (global) |
| Motivational | 5 | ~300+200 | Template | $0.00 | $0.00 |
| Quiz/Review | 15 | ~400+300 | Haiku | $0.04 | $0.01 (bank) |
| **Total** | | | | **~$0.54** | **~$0.18** |

**Target: < $0.25/user/month** — achievable with caching + template fallbacks.

#### Cost Reduction Levers
1. **Cohort caching** (narrative, quests) — same content for users at same stage: -60%
2. **Question bank** (assessment, quiz) — generate once, serve many: -70%
3. **Template fallbacks** (motivational, streak messages) — no LLM cost: -100% for those
4. **Prompt caching** (Anthropic feature) — reuse system prompts across calls: -25% input cost
5. **Batch generation** — 7 episodes at once vs 1/day: fewer overhead tokens

### 13.4 Per-User Rate Limiting

| Subscription Tier | Daily AI Token Budget | Max Generators/Day |
|-------------------|-----------------------|-------------------|
| Free | 50K tokens | 20 calls |
| Pro | 200K tokens | 80 calls |
| Champion | 500K tokens | 200 calls |

---

## 14. IMPLEMENTATION PHASES

### Phase A: Foundation (BLOCKER — 2-3 days)
**Files:** `core/llm-client.ts`, `core/llm-tracer.ts`, Prisma migration
- LLM Client with retry + fallback + timeout
- Tracer with `LlmUsage` + `LlmTrace` Prisma models
- Cost estimation function
- **Depends on:** Nothing
- **Unblocks:** Everything

### Phase B: Base Generator + Schemas (BLOCKER — 2-3 days)
**Files:** `core/base-generator.ts`, `schemas/*.ts`, `core/content-safety.service.ts`
- Abstract BaseGenerator class
- Zod schemas for roadmap, narrative, quest, assessment
- Content safety service (input/output filters)
- **Depends on:** Phase A
- **Unblocks:** All generators

### Phase C: Context Enrichment (BLOCKER — 1-2 days)
**Files:** `core/context-enrichment.service.ts`
- GeneratorContext builder
- Per-generator context budgets
- Skill Elo reading from DB
- **Depends on:** Phase B
- **Unblocks:** Personalized generators

### Phase D: Migrate Roadmap Generator (HIGH — 2 days)
**Files:** `generators/roadmap.generator.ts`
- Migrate from `AiService.generateRoadmap()` to `RoadmapGenerator`
- Add Zod validation, tracing, knowledge check generation
- Fix `regenRemainingTasks()` TODO
- **Depends on:** Phase B, C
- **Parallel with:** Phase E, F

### Phase E: Narrative Generator (HIGH — 2 days)
**Files:** `generators/narrative.generator.ts`
- Extract from `NarrativeService.generateEpisodeBatch()`
- Add SCORE coherence, character blueprints, Zod validation
- Add episode publish cron (`reviewed` → `published`)
- **Depends on:** Phase B, C
- **Parallel with:** Phase D, F

### Phase F: Quest + Assessment Generators (HIGH — 3 days)
**Files:** `generators/quest.generator.ts`, `generators/assessment.generator.ts`, `generators/quiz.generator.ts`
- QuestGenerator with flow state distribution + archetype preference
- AssessmentGenerator with Bloom's taxonomy + distractor types
- QuizGenerator for inline knowledge checks
- Elo-based difficulty targeting
- **Depends on:** Phase B, C
- **Parallel with:** Phase D, E

### Phase G: Recommendations + Micro-Content (MEDIUM — 2 days)
**Files:** `generators/recommendation.generator.ts`, `generators/fun-fact.generator.ts`, `generators/motivational.generator.ts`
- RecommendationEngine (what's-next)
- Fun fact batch generator
- Motivational message generator + template library
- **Depends on:** Phase B, C
- **Parallel with:** Phase D, E, F

### Phase H: Caching Layer (MEDIUM — 2 days)
**Files:** `core/cache.service.ts`
- In-memory cache (Map-based, no Redis needed initially)
- Cohort cache keys (season + episode, domain + difficulty)
- Question bank cache
- TTL management
- **Depends on:** Phase B
- **Parallel with:** Phases D-G

### Phase I: Code Challenges + Resources (LOW — 2 days)
**Files:** `generators/code-challenge.generator.ts`, `generators/resource.generator.ts`
- Code challenge generator for tech tracks
- Resource curation generator
- **Depends on:** Phase F (assessment patterns)

### Phase J: Prompt Registry + A/B Testing (LOW — 1-2 days)
**Files:** `core/prompt-registry.ts`
- DB-backed prompt templates (optional)
- Variant tracking in LlmTrace for A/B testing
- **Depends on:** Phase A (tracer)

```
Phase A ──→ Phase B ──→ Phase C ──→ ┬─ Phase D (roadmap)
                                     ├─ Phase E (narrative)
                                     ├─ Phase F (quest + assessment)
                                     └─ Phase G (recommendations)
                          Phase B ──→ Phase H (caching) — parallel
                          Phase F ──→ Phase I (code challenges)
                          Phase A ──→ Phase J (prompt registry)
```

**Critical path:** A → B → C → D/E/F (parallel) — estimated 8-10 days for core functionality.

---

## 15. KEY PRINCIPLES

1. **Validate everything** — Zod schemas on every LLM output. Never trust raw JSON.parse.
2. **Discriminated Unions** — For any "maybe do X" decision, force LLM to choose action type first.
3. **Tier your models** — Sonnet for quality-critical (roadmaps), Haiku for everything else.
4. **Enrich contextually** — Each generator gets only the context it needs (per-generator budgets).
5. **Track everything** — Lightweight usage on every call, full traces for debugging.
6. **Positive prompting** — "Choose X when..." not "Don't do Y unless...".
7. **Graceful degradation** — Retry → fallback model → cache → template → error.
8. **Batch when possible** — Narrative episodes, quest pools, fun facts — generate in bulk.
9. **Cache aggressively** — Cohort cache for shared content, question banks for assessment.
10. **Cost-aware** — Target <$0.25/user/month with optimizations.
11. **Bloom's taxonomy** — All questions tagged with cognitive level for pedagogical integrity.
12. **Elo-based difficulty** — Adaptive content difficulty based on skill estimation + ZPD.
13. **Character-aware** — Archetype blueprints influence tone, quest mix, and motivational style.
14. **Safety-first** — Multi-layer filtering (input → system prompt → output → human review).
15. **Template fallback** — Not everything needs AI. Common patterns use templates, AI for creative/personalized.

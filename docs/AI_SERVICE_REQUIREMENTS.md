# Plan2Skill AI Service — Requirements Specification

**Document type:** Requirements (SRS)
**Version:** 1.0
**Date:** 2026-03-04
**Prerequisites:** `docs/AI_SERVICE_METHODOLOGY.md` v2 (architecture & patterns reference)
**Scope:** All AI-powered content generation, personalization, and observability for Plan2Skill

---

## TABLE OF CONTENTS

1. [Overview & Goals](#1-overview--goals)
2. [Prisma Schema Changes](#2-prisma-schema-changes)
3. [NestJS Module Architecture](#3-nestjs-module-architecture)
4. [Core Infrastructure Requirements](#4-core-infrastructure-requirements)
5. [Generator Requirements](#5-generator-requirements)
6. [Testing Strategy](#6-testing-strategy)
7. [Acceptance Criteria by Phase](#7-acceptance-criteria-by-phase)
8. [Non-Functional Requirements](#8-non-functional-requirements)

---

## 1. OVERVIEW & GOALS

### 1.1 Problem Statement

The current `AiService` (129 lines, 2 methods) is a prototype with critical gaps:
- Zero output validation (`JSON.parse() as T`)
- No retries, no fallback, no error recovery
- No tracing — zero visibility into cost, quality, or latency
- Hardcoded single model (`claude-sonnet-4-6`) for all tasks
- No user context enrichment — all users get identical content
- No adaptive difficulty — no Elo, no ZPD, no Bloom's taxonomy
- No content safety filtering
- No caching — every call is fresh, even for shared content

### 1.2 Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Reliability** | Zod validation pass rate | > 95% first-call |
| **Cost efficiency** | Per-user monthly cost | < $0.25 with caching |
| **Observability** | LLM calls with tracing | 100% |
| **Quality** | Quiz question accuracy (Bloom's aligned) | > 85% human eval |
| **Latency** | 95th percentile response time | < 10s for any generator |
| **Personalization** | Content adapted to user skill level | Elo-based difficulty for all quiz/quest generators |
| **Safety** | Content policy violations | 0% in published content |

### 1.3 Out of Scope (This Version)

- RAG pipeline (knowledge base for fact-checking) — P2 future
- A/B testing framework for prompts — Phase J, optional
- Multi-language content generation (i18n) — future phase
- Real-time streaming responses to client — future UX enhancement
- External AI providers (OpenAI, Gemini) — Anthropic-only for now

---

## 2. PRISMA SCHEMA CHANGES

### 2.1 New Models

#### REQ-DB-01: `LlmUsage` — Lightweight cost tracking (every AI call)

```prisma
model LlmUsage {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  generatorType String   @db.VarChar(30)   // roadmap, narrative, quest, assessment, etc.
  model         String   @db.VarChar(50)   // claude-sonnet-4-6, claude-haiku-4-5
  purpose       String   @db.VarChar(50)   // roadmap_generation, episode_batch, quiz_gen, etc.
  inputTokens   Int
  outputTokens  Int
  costUsd       Decimal  @db.Decimal(10, 6)
  durationMs    Int
  success       Boolean  @default(true)
  attempt       Int      @default(1)       // retry attempt number (1 = first try)
  cacheHit      Boolean  @default(false)   // true if served from cache
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([generatorType, createdAt])
  @@index([createdAt])
  @@map("llm_usage")
}
```

**Rationale:** Every AI call must be tracked for cost visibility, abuse detection, and per-user rate limiting. The `cacheHit` field allows distinguishing real LLM calls from cached responses in analytics.

#### REQ-DB-02: `LlmTrace` — Full prompt/response trace (opt-in, for debugging)

```prisma
model LlmTrace {
  id               String   @id @default(uuid()) @db.Uuid
  usageId          String   @db.Uuid
  systemPrompt     String   @db.Text
  userPrompt       String   @db.Text
  responseText     String?  @db.Text
  structuredOutput Json?
  errorMessage     String?  @db.Text
  createdAt        DateTime @default(now())

  usage LlmUsage @relation(fields: [usageId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@map("llm_trace")
}
```

**Rationale:** Full traces stored separately from usage (1:1 relation). Enables debugging prompt quality, reviewing LLM failures, and auditing outputs. Should have a retention policy (e.g., 30 days for traces, indefinite for usage).

#### REQ-DB-03: `SkillElo` — Per-user per-domain skill estimation

```prisma
model SkillElo {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @db.Uuid
  skillDomain     String   @db.VarChar(50)  // "javascript", "react", "algorithms", etc.
  elo             Int      @default(1200)   // starting Elo
  assessmentCount Int      @default(0)      // number of assessed interactions (for K-factor decay)
  lastAssessedAt  DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skillDomain])
  @@index([userId])
  @@map("skill_elo")
}
```

**Rationale:** Elo-based adaptive difficulty requires persistent per-user per-domain skill ratings. `assessmentCount` drives K-factor decay (40 → 32 → 16) for increasingly stable ratings. Used by QuestGenerator, AssessmentGenerator, QuizGenerator, CodeChallengeGenerator for ZPD targeting.

#### REQ-DB-04: `AiCache` — Persistent cache for generated content

```prisma
model AiCache {
  id            String   @id @default(uuid()) @db.Uuid
  cacheKey      String   @unique @db.VarChar(255)  // generator:domain:difficulty:hash
  generatorType String   @db.VarChar(30)
  content       Json                                // cached structured output
  hitCount      Int      @default(0)
  expiresAt     DateTime
  createdAt     DateTime @default(now())

  @@index([generatorType, expiresAt])
  @@index([expiresAt])
  @@map("ai_cache")
}
```

**Rationale:** DB-backed cache (vs in-memory) survives API restarts and works across multiple instances. TTL-based expiration via `expiresAt`. `hitCount` enables cache analytics (what content is reused most). A periodic cleanup job removes expired entries.

### 2.2 Modifications to Existing Models

#### REQ-DB-05: `Task` — Add `bloomLevel` field

```prisma
// Add to existing Task model:
bloomLevel  String?  @db.VarChar(15)  // remember, understand, apply, analyze, evaluate, create
```

**Current state:** `Task` already has `difficultyTier` (1-5), `knowledgeCheck` (Json), `skillDomain`, `validationType`. These are sufficient for current quest logic.

**New field:** `bloomLevel` enables Bloom's taxonomy tracking on tasks with knowledge checks. When AI generates a task with a quiz, it tags the Bloom's level. This feeds into:
- Assessment accuracy reporting
- Elo updates (higher Bloom's = harder question = higher effective difficulty)
- Roadmap progression analytics (are users progressing up the taxonomy?)

#### REQ-DB-06: `ReviewItem` — Add `bloomLevel` + `aiGeneratedPrompt`

```prisma
// Add to existing ReviewItem model:
bloomLevel        String?  @db.VarChar(15)  // for AI-enhanced review prompts
aiGeneratedPrompt String?  @db.Text         // contextual review question (replaces generic "Review: X")
```

**Rationale:** AI-enhanced spaced repetition generates contextual review prompts instead of generic "Review: {skillId}" labels. The `bloomLevel` tracks cognitive level of the review to ensure progression.

#### REQ-DB-07: `User` — Add `LlmUsage` relation

```prisma
// Add to existing User model relations:
llmUsage  LlmUsage[]
skillElos SkillElo[]
```

#### REQ-DB-08: `Episode` — Add `toneProfile` field

```prisma
// Add to existing Episode model:
toneProfile  String?  @db.VarChar(20)  // inspiring, dramatic, humorous, calm
```

**Rationale:** SCORE coherence system tracks tone per episode. Enables variety enforcement (e.g., no more than 3 consecutive episodes with same tone).

### 2.3 Schema Change Summary

| Change Type | Model | Fields | Migration Risk |
|-------------|-------|--------|---------------|
| **New model** | `LlmUsage` | 12 fields | None — new table |
| **New model** | `LlmTrace` | 7 fields | None — new table |
| **New model** | `SkillElo` | 7 fields | None — new table |
| **New model** | `AiCache` | 7 fields | None — new table |
| **Add field** | `Task` | `bloomLevel` (nullable) | Zero risk — nullable, no data migration |
| **Add field** | `ReviewItem` | `bloomLevel`, `aiGeneratedPrompt` (both nullable) | Zero risk |
| **Add field** | `Episode` | `toneProfile` (nullable) | Zero risk |
| **Add relation** | `User` | `llmUsage[]`, `skillElos[]` | Zero risk — Prisma relation only |

**All changes are additive and nullable** — zero-downtime migration, no data backfill required.

---

## 3. NESTJS MODULE ARCHITECTURE

### 3.1 Decision: Single Expanded `AiModule`

**Question:** One `AiModule` with all generators, or per-domain modules (e.g., `AiRoadmapModule`, `AiNarrativeModule`)?

**Decision: Single `AiModule`.** Rationale:

| Factor | Single Module | Per-Domain Modules |
|--------|--------------|-------------------|
| **Simplicity** | 1 module to import | 10+ modules to manage |
| **Shared deps** | LlmClient, Tracer, CacheService shared naturally | Each module re-imports shared deps |
| **Circular risk** | None — AiModule is a leaf | Higher — generators might need each other |
| **Consumer simplicity** | `imports: [AiModule]` → access any generator | Must import specific modules per feature |
| **Testing** | One module to mock | Multiple mocks needed |
| **Scalability** | Can split later if needed | Premature separation |

**NestJS doesn't penalize large modules.** All generators share the same 5 core dependencies (LlmClient, Tracer, CacheService, ContextEnrichmentService, ContentSafetyService). A single module is the natural grouping.

### 3.2 Module Structure

```typescript
// apps/api/src/ai/ai.module.ts

@Module({
  imports: [
    PrismaModule,          // For SkillElo, LlmUsage, LlmTrace, AiCache queries
    // Note: PrismaModule is @Global() so this import is optional but explicit
  ],
  providers: [
    // ── Core infrastructure ──
    LlmClient,
    LlmTracer,
    CacheService,
    ContextEnrichmentService,
    ContentSafetyService,

    // ── Generators ──
    RoadmapGenerator,
    NarrativeGenerator,
    QuestGenerator,
    AssessmentGenerator,
    RecommendationGenerator,
    FunFactGenerator,
    ResourceGenerator,
    MotivationalGenerator,
    QuizGenerator,
    CodeChallengeGenerator,
  ],
  exports: [
    // Export generators that domain services need
    RoadmapGenerator,
    NarrativeGenerator,
    QuestGenerator,
    AssessmentGenerator,
    RecommendationGenerator,
    FunFactGenerator,
    ResourceGenerator,
    MotivationalGenerator,
    QuizGenerator,
    CodeChallengeGenerator,

    // Export core services for direct use by admin endpoints
    LlmTracer,       // Admin: ai.usage, ai.traces
    CacheService,    // Admin: cache invalidation
  ],
})
export class AiModule {}
```

### 3.3 Consumer Module Changes

| Module | Current Import | New Import | Service Change |
|--------|---------------|------------|---------------|
| `RoadmapModule` | `AiModule` (uses `AiService`) | `AiModule` (uses `RoadmapGenerator`) | Migrate `AiService.generateRoadmap()` → `RoadmapGenerator.generate()` |
| `NarrativeModule` | `AiModule` (uses `AiService`) | `AiModule` (uses `NarrativeGenerator`) | Migrate `AiService.generateJSON()` → `NarrativeGenerator.generate()` |
| `QuestModule` | — (no AI) | `AiModule` (uses `QuestGenerator`) | Add AI quest content generation |
| `TrpcModule` | `AiModule` | `AiModule` | No change — just wiring |

**Migration path:** `AiService` is kept temporarily (deprecated) while generators are built. Once all consumers migrate, `AiService` is deleted.

```typescript
// Transitional: AiModule exports both old and new
exports: [
  AiService,          // DEPRECATED — remove after all consumers migrate
  RoadmapGenerator,   // NEW — replaces AiService.generateRoadmap()
  NarrativeGenerator, // NEW — replaces AiService.generateJSON() for narrative
  // ...
],
```

### 3.4 Dependency Injection Flow

```
RoadmapService (roadmap.service.ts)
  └── @Inject(RoadmapGenerator)
        └── constructor(
              llmClient: LlmClient,
              tracer: LlmTracer,
              contextService: ContextEnrichmentService,
              cacheService: CacheService,
              safetyService: ContentSafetyService,
            )
```

All 5 core dependencies are injected into `BaseGenerator` via NestJS DI. Concrete generators extend `BaseGenerator` and receive them automatically:

```typescript
// generators/roadmap.generator.ts
@Injectable()
export class RoadmapGenerator extends BaseGenerator<GenerateRoadmapInput, AiRoadmapResult> {
  readonly generatorType = 'roadmap';
  readonly modelTier = ModelTier.QUALITY;
  readonly temperature = 0.3;
  readonly maxTokens = 4096;
  readonly outputSchema = AiRoadmapSchema;

  constructor(
    llmClient: LlmClient,
    tracer: LlmTracer,
    contextService: ContextEnrichmentService,
    cacheService: CacheService,
    safetyService: ContentSafetyService,
  ) {
    super(llmClient, tracer, contextService, cacheService, safetyService);
  }

  buildSystemPrompt(context: GeneratorContext): string { /* ... */ }
  buildUserPrompt(input: GenerateRoadmapInput, context: GeneratorContext): string { /* ... */ }
}
```

### 3.5 ContextEnrichmentService Dependencies

`ContextEnrichmentService` needs to read user data from multiple sources:

```typescript
@Injectable()
export class ContextEnrichmentService {
  constructor(private readonly prisma: PrismaService) {}

  async build(userId: string, generatorType: string): Promise<GeneratorContext> {
    // Single transaction with parallel queries
    const [user, progression, character, streak, skillElos, recentCompletions] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.userProgression.findUnique({ where: { userId } }),
        this.prisma.character.findUnique({ where: { userId } }),
        this.prisma.streak.findUnique({ where: { userId } }),
        this.prisma.skillElo.findMany({ where: { userId } }),
        this.prisma.questCompletion.findMany({
          where: { userId, completedAt: { gte: thirtyDaysAgo() } },
          select: { questType: true, rarity: true, qualityScore: true },
        }),
      ]);

    // Build full context
    const fullContext: GeneratorContext = { /* ... */ };

    // Filter to generator-specific budget
    return filterByBudget(fullContext, generatorType);
  }
}
```

**Key design choice:** `ContextEnrichmentService` uses only `PrismaService` — no circular deps on domain services. All data is read directly from DB. This keeps the AI module as a leaf dependency.

---

## 4. CORE INFRASTRUCTURE REQUIREMENTS

### REQ-CORE-01: LLM Client (`core/llm-client.ts`)

**Must have:**
- [ ] Multi-model support: resolve model by `ModelTier` enum
- [ ] Retry logic: up to 2 retries with exponential backoff (1s, 2s)
- [ ] Timeout: configurable per-call, default 30s
- [ ] Fallback: if tier has fallback models, try next on failure
- [ ] Return typed `LlmResponse`: `{ text: string, usage: { inputTokens, outputTokens } }`
- [ ] Retriable error detection: rate_limit, overloaded, 529, 503, 502, timeout
- [ ] Anthropic SDK: use existing `@anthropic-ai/sdk` dependency

**Config (via `ConfigService`):**
```
ANTHROPIC_API_KEY   — required
LLM_MAX_RETRIES     — optional, default: 2
LLM_TIMEOUT_MS      — optional, default: 30000
```

### REQ-CORE-02: LLM Tracer (`core/llm-tracer.ts`)

**Must have:**
- [ ] `trackSuccess(data)` — writes `LlmUsage` row + optionally `LlmTrace` row
- [ ] `trackFailure(data)` — writes `LlmUsage` (success=false) + `LlmTrace` with errorMessage
- [ ] Cost estimation: calculate `costUsd` from model + token counts
- [ ] Full trace toggle: controlled by env var `LLM_TRACE_FULL=true|false` (default: false in production, true in development)
- [ ] Async writes: tracer calls should not block generator response (use `setImmediate` or fire-and-forget Promise)

### REQ-CORE-03: Cache Service (`core/cache.service.ts`)

**Must have:**
- [ ] `get<T>(key: string): Promise<T | null>` — read from `AiCache` table, check `expiresAt`
- [ ] `set<T>(key: string, value: T, ttlSeconds: number): Promise<void>` — write to `AiCache`
- [ ] `invalidate(pattern: string): Promise<number>` — delete matching keys (glob-like)
- [ ] Hit count tracking: increment `hitCount` on each `get` hit
- [ ] Expired entry cleanup: periodic purge of expired entries (on every N-th `get` or via scheduled task)
- [ ] Cache key convention: `{generatorType}:{domain}:{difficultyTier}:{contentHash}`

**Nice to have:**
- [ ] In-memory LRU layer in front of DB for hot keys (avoid DB round-trip for frequent reads)

### REQ-CORE-04: Context Enrichment Service (`core/context-enrichment.service.ts`)

**Must have:**
- [ ] `build(userId, generatorType): Promise<GeneratorContext>` — fetch user data, filter by generator budget
- [ ] Parallel DB queries (6 queries: user, progression, character, streak, skillElos, recentCompletions)
- [ ] Per-generator context budget filtering (see §4.4 in Methodology)
- [ ] Graceful defaults for missing data (new users with no character, no completions, etc.)
- [ ] Token budget awareness: compress context to fit within ~4K chars

### REQ-CORE-05: Content Safety Service (`core/content-safety.service.ts`)

**Must have:**
- [ ] `filterInput(text: string): string` — sanitize user-provided text (strip injection attempts, role markers, code blocks)
- [ ] `filterOutput(result: unknown): void` — scan generated text for blocklisted keywords, throw if detected
- [ ] Blocklist: configurable keyword list for prohibited content categories
- [ ] Length enforcement: max character limits per field

**Nice to have:**
- [ ] Injection pattern detection with warning log (for monitoring, not blocking)

### REQ-CORE-06: Base Generator (`core/base-generator.ts`)

**Must have:**
- [ ] Abstract class `BaseGenerator<TInput, TOutput>` with:
  - `generatorType`, `modelTier`, `temperature`, `maxTokens`, `outputSchema` (abstract readonly)
  - `buildSystemPrompt(context)`, `buildUserPrompt(input, context)` (abstract methods)
  - `generate(userId, input): Promise<TOutput>` (concrete, non-overridable core flow)
  - `getCacheKey(input): string | null` (optional override for cacheable generators)
- [ ] Core flow in `generate()`:
  1. Build context via `ContextEnrichmentService`
  2. Check cache via `CacheService`
  3. Build prompts
  4. Filter input via `ContentSafetyService`
  5. Call LLM via `LlmClient`
  6. `JSON.parse()` + `outputSchema.parse()` (Zod validation)
  7. Filter output via `ContentSafetyService`
  8. Write cache via `CacheService`
  9. Track via `LlmTracer`
  10. Return validated result
- [ ] On Zod validation failure: track as failure, throw descriptive error
- [ ] On LLM failure after all retries: track as failure, re-throw

---

## 5. GENERATOR REQUIREMENTS

### REQ-GEN-01: RoadmapGenerator

**Priority:** Phase D (first generator to migrate)
**Replaces:** `AiService.generateRoadmap()`

- [ ] Tier 1 (Sonnet), temperature 0.3, max 4096 tokens
- [ ] Input: `GenerateRoadmapInput` (goal, role, experience, minutes, tools, superpower)
- [ ] Output: `AiRoadmapSchema` (Zod-validated)
- [ ] Context: `userProfile` + `learningContext`
- [ ] Knowledge checks: generate inline `knowledgeCheck` objects with Bloom's level for quiz-type tasks
- [ ] Skill domain tagging: every task gets a `skillDomain` for Elo/spaced-repetition integration
- [ ] Rarity distribution: enforce ~40% common, 25% uncommon, 20% rare, 10% epic, 5% legendary via prompt
- [ ] Boss task: use Discriminated Union pattern (see Methodology §4.2) — AI chooses standard_tasks vs include_boss per milestone
- [ ] No caching (unique per user)

**Acceptance criteria:**
- Zod validation passes on ≥95% of calls (test with 20 diverse inputs)
- Every task has `skillDomain` populated
- At least 60% of quiz-type tasks include `knowledgeCheck` with valid structure
- Cost per call: < $0.10

### REQ-GEN-02: NarrativeGenerator

**Priority:** Phase E
**Replaces:** `NarrativeService.generateEpisodeBatch()` AI logic

- [ ] Tier 2 (Haiku), temperature 0.7, max 2048 tokens
- [ ] Input: `{ seasonId, episodeNumber, cliffhangerTemplate }` — season context loaded internally
- [ ] Output: `AiEpisodeSchema` (Zod-validated, see Methodology §5.2)
- [ ] Context: `userProfile` + `characterContext` + `narrativeContext`
- [ ] SCORE coherence: inject Story Bible (compressed ~500 tokens) + last 3 episode summaries
- [ ] Character blueprint: archetype influences `toneProfile` in output
- [ ] Cliffhanger template rotation: generator receives which pattern to use (revelation/choice/danger/mystery/transformation)
- [ ] Continuity check: output includes `referencedCharacters`, `referencedLocations`, `plotThreadsAdvanced`
- [ ] Word count enforcement: 80-250 words in `body` field (Zod min/max on string length as proxy)
- [ ] Cohort caching: same episodes for all users in same season (cache key: `narrative:{seasonId}:{episodeNumber}`)

**Acceptance criteria:**
- Zod validation passes on ≥90% of calls
- Word count within 80-250 range on ≥95% of episodes
- `continuityCheck.referencedCharacters` contains only names from Story Bible on ≥90%
- Cost per episode: < $0.01

### REQ-GEN-03: QuestGenerator

**Priority:** Phase F
**New:** Currently no AI in quest system

- [ ] Tier 3 (Haiku), temperature 0.5, max 1024 tokens
- [ ] Input: `{ skillDomains: string[], targetDifficulties: number[], archetypeId: string, count: number }`
- [ ] Output: `AiQuestBatchSchema` (Zod-validated)
- [ ] Context: `userProfile` + `learningContext` + `characterContext` + `performanceContext`
- [ ] Flow state distribution: 70% stretch / 20% mastery / 10% review (see Methodology §8.4)
- [ ] Archetype-aware quest mix: weight task types by archetype preference table
- [ ] Difficulty targeting: use Elo from `SkillElo` + ZPD adjustment
- [ ] Cohort caching: cache key `quest:{domain}:{difficultyTier}:{archetypeId}`
- [ ] Each quest includes optional `knowledgeCheck` for knowledge/quiz type quests

**Acceptance criteria:**
- Zod validation passes on ≥95% of calls
- Difficulty distribution matches flow state target (±10%)
- Quest types include ≥3 distinct `questType` values per batch
- Cost per batch: < $0.005

### REQ-GEN-04: AssessmentGenerator (Bloom's Taxonomy)

**Priority:** Phase F
**New:** No assessment generation exists

- [ ] Tier 2 (Haiku), temperature 0.3, max 2048 tokens
- [ ] Input: `{ skillDomain, targetDifficulty, questionCount, bloomDistribution, assessmentType }`
- [ ] Output: `AiAssessmentSchema` (Zod-validated, see Methodology §5.4)
- [ ] Context: `learningContext` + `performanceContext`
- [ ] Bloom's distribution: configurable per assessment type (onboarding, milestone gate, mastery check)
- [ ] Distractor generation: each wrong option tagged with `distractorType`
- [ ] Difficulty calibration: question difficulty targets Elo from `SkillElo` + ZPD
- [ ] Question bank caching: cache key `assessment:{domain}:{bloomLevel}:{difficulty}`
- [ ] Post-generation: update `SkillElo` based on user answers (Elo formula with K-factor decay)

**Acceptance criteria:**
- Zod validation passes on ≥90% of calls
- Each question has exactly 4 options with exactly 1 correct
- `bloomLevel` distribution matches requested distribution (±1 question)
- Explanations are ≥20 chars and reference the correct answer
- Cost per assessment (5 questions): < $0.008

### REQ-GEN-05: RecommendationGenerator

**Priority:** Phase G
**New:** `WhatsNextOption` type exists but no AI backend

- [ ] Tier 3 (Haiku), temperature 0.5, max 512 tokens
- [ ] Input: `{ recentCompletions, currentMilestone, skillGaps }`
- [ ] Output: `AiRecommendationSchema` (Zod-validated)
- [ ] Context: `userProfile` + `learningContext` + `performanceContext`
- [ ] 2-5 recommendations per call, prioritized
- [ ] Types: `next_task`, `skill_gap`, `explore_topic`, `review_session`, `take_break`
- [ ] Per-user caching: 1-hour TTL, invalidated on task completion

### REQ-GEN-06: FunFactGenerator

**Priority:** Phase G
**New:** No micro-content generation exists

- [ ] Tier 3 (Haiku), temperature 0.6, max 600 tokens
- [ ] Input: `{ skillDomains: string[], count: number }`
- [ ] Output: `AiFunFactBatchSchema` (Zod-validated)
- [ ] Context: `learningContext` (skill domains only)
- [ ] Batch generation: 10-20 facts at once
- [ ] Global caching: same facts for all users in same domain, 24h TTL
- [ ] Tweet-length: 20-280 chars per fact

### REQ-GEN-07: MotivationalGenerator

**Priority:** Phase G
**Hybrid:** Template for common milestones, AI for custom

- [ ] Tier 3 (Haiku) or Tier 4 (Template), temperature 0.7, max 256 tokens
- [ ] Template library: pre-written messages for streaks ≤30 days, common level-ups, standard achievements
- [ ] AI generation: streaks >30 days, unusual achievements, custom celebrations
- [ ] Character blueprint: archetype influences motivational style
- [ ] Decision function: `shouldUseAi(triggerType, data)` returns boolean

### REQ-GEN-08: QuizGenerator (Knowledge Checks)

**Priority:** Phase F (ships with AssessmentGenerator)
**New:** Knowledge checks currently come from seed data or roadmap generation

- [ ] Tier 3 (Haiku), temperature 0.3, max 512 tokens
- [ ] Input: `{ skillDomain, taskTitle, taskDescription, difficulty }`
- [ ] Output: single `AiKnowledgeCheckSchema` (question, 4 options, correctIndex, explanation, bloomLevel)
- [ ] Optimized for inline use: generate 1 question per call (low latency)
- [ ] Question bank caching: cache by `domain:difficulty:bloomLevel`

### REQ-GEN-09: CodeChallengeGenerator

**Priority:** Phase I (depends on assessment patterns)
**New:** No code challenge generation exists

- [ ] Tier 2 (Haiku with Sonnet fallback), temperature 0.5, max 1536 tokens
- [ ] Input: `{ language, concepts, difficulty, taskContext }`
- [ ] Output: `AiCodeChallengeSchema` (Zod-validated)
- [ ] Starter code + expected output + hints
- [ ] Per-language + difficulty caching, 7-day TTL

### REQ-GEN-10: ResourceGenerator

**Priority:** Phase I
**New:** No resource curation exists

- [ ] Tier 3 (Haiku), temperature 0.4, max 512 tokens
- [ ] Input: `{ skillDomain, currentLevel, preferredFormats }`
- [ ] Output: list of suggested resources with type (video, article, course, tool) and rationale
- [ ] Per-domain caching, 7-day TTL

---

## 6. TESTING STRATEGY

### 6.1 Current State

**Zero test infrastructure exists.** No test runner, no test files, no test scripts, no testing framework dependencies in `package.json`. This is a greenfield testing setup.

### 6.2 Framework Choice

**Vitest** (not Jest). Rationale:

| Factor | Vitest | Jest |
|--------|--------|------|
| Speed | Native ESM, faster startup | Slower, transform overhead |
| TypeScript | Native TS support via Vite | Needs ts-jest or SWC transform |
| Monorepo | Workspace-aware out of box | Manual config per package |
| Compatibility | Jest-compatible API (drop-in) | — |
| DX | Watch mode, inline snapshots | Watch mode, snapshots |

### 6.3 Setup Requirements

#### REQ-TEST-01: Install testing dependencies

```
# Root (monorepo)
devDependencies:
  vitest
  @vitest/coverage-v8

# apps/api
devDependencies:
  @nestjs/testing         # NestJS test utilities (Test.createTestingModule)
  vitest
```

#### REQ-TEST-02: Configuration files

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: '.',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/ai/**'],
    },
  },
});
```

#### REQ-TEST-03: Package.json scripts

```json
// apps/api/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 6.4 Test Layers

```
Layer 1: UNIT TESTS (fast, no external deps)
├── Zod schema validation tests
├── Cost estimation function tests
├── Content safety filter tests
├── Elo calculation tests
├── Cache key generation tests
└── Context budget filtering tests

Layer 2: INTEGRATION TESTS (mocked LLM client)
├── BaseGenerator flow tests (mock LlmClient → verify Zod → verify tracer called)
├── Each generator: mock LlmClient with realistic response → verify output shape
├── Retry logic tests (mock failures → verify retry count)
├── Fallback model tests (mock primary failure → verify fallback used)
├── Cache hit/miss tests (mock cache → verify LLM called/skipped)
└── Context enrichment tests (mock PrismaService → verify correct fields)

Layer 3: EVALUATION TESTS (real LLM, CI-optional)
├── Quality evaluation: run each generator 5x with diverse inputs → measure Zod pass rate
├── Prompt regression: snapshot test system prompts → detect unintended changes
├── Cost monitoring: run generators → verify token usage within expected bounds
└── These tests marked as `describe.skip` in CI (require API key + cost $)
```

### 6.5 Detailed Test Requirements

#### REQ-TEST-04: Zod Schema Unit Tests

For each schema (`AiRoadmapSchema`, `AiEpisodeSchema`, `AiQuestBatchSchema`, `AiAssessmentSchema`, etc.):

```typescript
describe('AiRoadmapSchema', () => {
  it('validates a correct roadmap structure', () => {
    const valid = { title: 'React in 90 Days', description: '...', milestones: [...] };
    expect(() => AiRoadmapSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    const invalid = { title: 'X' }; // too short, missing milestones
    expect(() => AiRoadmapSchema.parse(invalid)).toThrow(ZodError);
  });

  it('rejects invalid taskType enum values', () => {
    const invalid = { /* valid structure but taskType: 'invalid' */ };
    expect(() => AiRoadmapSchema.parse(invalid)).toThrow();
  });

  it('enforces min/max constraints', () => {
    // title too short, milestones too few, XP out of range, etc.
  });
});
```

**Coverage target:** Every schema field's min/max/enum constraints tested with valid + invalid cases.

#### REQ-TEST-05: LlmClient Unit Tests (Mock Anthropic SDK)

```typescript
describe('LlmClient', () => {
  it('returns text from successful response', async () => { /* ... */ });
  it('retries on rate_limit error (up to maxRetries)', async () => { /* ... */ });
  it('does not retry on non-retriable errors', async () => { /* ... */ });
  it('falls back to next model in tier on exhausted retries', async () => { /* ... */ });
  it('throws after all retries and fallbacks exhausted', async () => { /* ... */ });
  it('respects timeout', async () => { /* ... */ });
  it('resolves correct model for each tier', () => { /* ... */ });
});
```

#### REQ-TEST-06: BaseGenerator Integration Tests (Mock LlmClient)

```typescript
describe('BaseGenerator (via RoadmapGenerator)', () => {
  let generator: RoadmapGenerator;
  let mockLlmClient: MockLlmClient;
  let mockTracer: MockLlmTracer;
  // ... setup with NestJS Test.createTestingModule

  it('calls LlmClient with correct model tier', async () => { /* ... */ });
  it('validates output with Zod schema', async () => { /* ... */ });
  it('tracks success in tracer', async () => { /* ... */ });
  it('tracks failure in tracer on Zod validation error', async () => { /* ... */ });
  it('checks cache before calling LLM', async () => { /* ... */ });
  it('writes cache after successful generation', async () => { /* ... */ });
  it('calls content safety filter on input and output', async () => { /* ... */ });
  it('passes correct context fields for generator type', async () => { /* ... */ });
});
```

#### REQ-TEST-07: Context Enrichment Tests (Mock Prisma)

```typescript
describe('ContextEnrichmentService', () => {
  it('returns userProfile + learningContext for roadmap generator', async () => { /* ... */ });
  it('includes narrativeContext only for narrative generator', async () => { /* ... */ });
  it('returns defaults for new user with no data', async () => { /* ... */ });
  it('excludes performanceContext for generators that dont need it', async () => { /* ... */ });
  it('compresses context to fit within token budget', async () => { /* ... */ });
});
```

#### REQ-TEST-08: Content Safety Tests

```typescript
describe('ContentSafetyService', () => {
  it('strips code blocks from user input', () => { /* ... */ });
  it('strips role markers (system:, assistant:)', () => { /* ... */ });
  it('strips common injection phrases', () => { /* ... */ });
  it('enforces max length on input', () => { /* ... */ });
  it('throws on blocklisted keywords in output', () => { /* ... */ });
  it('passes clean content through unchanged', () => { /* ... */ });
});
```

#### REQ-TEST-09: Elo Calculation Tests

```typescript
describe('Elo calculations', () => {
  it('increases Elo on correct answer to hard question', () => { /* ... */ });
  it('decreases Elo on wrong answer to easy question', () => { /* ... */ });
  it('uses K=40 for first 10 assessments', () => { /* ... */ });
  it('uses K=32 for assessments 10-20', () => { /* ... */ });
  it('uses K=16 after 20 assessments', () => { /* ... */ });
  it('returns ZPD target difficulty based on accuracy rate', () => { /* ... */ });
});
```

#### REQ-TEST-10: Evaluation Tests (Real LLM — CI-Optional)

```typescript
describe.skipIf(!process.env.ANTHROPIC_API_KEY)('RoadmapGenerator eval', () => {
  it('generates valid roadmap for "Learn React" goal', async () => {
    const result = await generator.generate(testUserId, {
      goal: 'Learn React', currentRole: 'Junior Developer',
      experienceLevel: 'beginner', dailyMinutes: 30,
      selectedTools: ['VS Code'], superpower: 'problem solving',
    });
    expect(() => AiRoadmapSchema.parse(result)).not.toThrow();
    expect(result.milestones.length).toBeGreaterThanOrEqual(4);
    expect(result.milestones.every(m => m.tasks.length >= 5)).toBe(true);
  });

  it('passes Zod validation on 4/5 diverse inputs', async () => {
    const inputs = [/* 5 diverse goal/role/level combos */];
    const results = await Promise.allSettled(inputs.map(i => generator.generate(testUserId, i)));
    const successes = results.filter(r => r.status === 'fulfilled');
    expect(successes.length).toBeGreaterThanOrEqual(4); // ≥80% pass rate
  });
});
```

### 6.6 Mock Strategy

```typescript
// test/mocks/mock-llm-client.ts
export class MockLlmClient implements ILlmClient {
  private responses: Map<string, string> = new Map();

  setResponse(generatorType: string, response: object): void {
    this.responses.set(generatorType, JSON.stringify(response));
  }

  async call(options: LlmCallOptions): Promise<LlmResponse> {
    const text = this.responses.get('default') ?? '{}';
    return {
      text,
      usage: { inputTokens: 100, outputTokens: 200 },
    };
  }
}

// test/mocks/mock-tracer.ts
export class MockLlmTracer implements ILlmTracer {
  public successCalls: any[] = [];
  public failureCalls: any[] = [];

  async trackSuccess(data: any): Promise<void> { this.successCalls.push(data); }
  async trackFailure(data: any): Promise<void> { this.failureCalls.push(data); }
}
```

**Key principle:** `LlmClient` and `LlmTracer` are injected via interfaces, making them trivially mockable for tests. This is why `BaseGenerator` receives them in the constructor.

### 6.7 Test Coverage Targets

| Layer | Files | Coverage Target |
|-------|-------|----------------|
| Zod schemas | `schemas/*.ts` | 100% (all constraints tested) |
| Core utilities | `llm-client.ts`, `content-safety.ts`, Elo functions | > 90% |
| BaseGenerator flow | `base-generator.ts` | > 90% |
| Context enrichment | `context-enrichment.service.ts` | > 80% |
| Each generator (prompt building) | `generators/*.ts` | > 70% |
| Eval (real LLM) | — | Not counted in coverage |

---

## 7. ACCEPTANCE CRITERIA BY PHASE

### Phase A: Foundation

- [ ] `LlmClient` resolves correct model for each `ModelTier` value
- [ ] `LlmClient` retries rate_limit errors up to 2 times with exponential backoff
- [ ] `LlmClient` falls back to next model in tier after all retries exhausted
- [ ] `LlmTracer` writes `LlmUsage` row on every call (success and failure)
- [ ] `LlmTracer` writes `LlmTrace` row when `LLM_TRACE_FULL=true`
- [ ] `LlmTracer` calculates `costUsd` correctly for Sonnet and Haiku models
- [ ] Prisma migration runs cleanly: `LlmUsage`, `LlmTrace`, `SkillElo`, `AiCache` tables created
- [ ] Unit tests pass for LlmClient (retry, fallback, timeout, model resolution)
- [ ] TypeScript: `tsc --noEmit` shows zero new errors

### Phase B: Base Generator + Schemas

- [ ] `BaseGenerator.generate()` follows the 10-step flow (context → cache → prompt → safety → LLM → validate → safety → cache → trace → return)
- [ ] Zod validation failure triggers `tracer.trackFailure()` with response text
- [ ] All schemas validate expected structures and reject invalid ones
- [ ] `ContentSafetyService.filterInput()` strips injection patterns
- [ ] `ContentSafetyService.filterOutput()` catches blocklisted keywords
- [ ] Unit tests: all schemas tested (valid + invalid cases)
- [ ] Integration test: BaseGenerator with MockLlmClient returns validated output

### Phase C: Context Enrichment

- [ ] `ContextEnrichmentService.build()` returns only fields in the generator's budget
- [ ] Missing user data (new users) returns sensible defaults
- [ ] `skillElo` data included in `learningContext` when available
- [ ] `performanceContext` computed from last 30 days of `QuestCompletion` records
- [ ] Context size stays within ~4K chars per generator

### Phase D: Roadmap Generator

- [ ] `RoadmapGenerator` replaces `AiService.generateRoadmap()` in `RoadmapService`
- [ ] Output passes `AiRoadmapSchema` validation on ≥95% of calls
- [ ] Every task has `skillDomain` populated
- [ ] Boss task decision uses Discriminated Union pattern
- [ ] `regenRemainingTasks()` TODO is resolved (calls `RoadmapGenerator`)
- [ ] `AiService.generateRoadmap()` marked as `@deprecated`
- [ ] Tracing: every roadmap generation tracked in `LlmUsage`

### Phase E: Narrative Generator

- [ ] `NarrativeGenerator` replaces inline AI logic in `NarrativeService.generateEpisodeBatch()`
- [ ] Story Bible + last 3 summaries injected as context
- [ ] Character blueprint influences `toneProfile` in output
- [ ] Continuity check validates character/location references
- [ ] Episodes pass Zod validation and word count check (80-250)
- [ ] `AiService.generateJSON()` marked as `@deprecated`

### Phase F: Quest + Assessment + Quiz

- [ ] `QuestGenerator` produces quest batches with correct flow state distribution
- [ ] `AssessmentGenerator` produces questions with Bloom's taxonomy levels
- [ ] Distractor options tagged with `distractorType`
- [ ] `QuizGenerator` produces single knowledge checks for inline use
- [ ] Elo updates: `SkillElo` record updated after assessment answers
- [ ] `bloomLevel` populated on `Task` and `ReviewItem` records when AI-generated

### Phase G: Recommendations + Micro-Content

- [ ] `RecommendationGenerator` produces 2-5 prioritized suggestions
- [ ] `FunFactGenerator` produces batch of 10-20 domain-relevant facts
- [ ] `MotivationalGenerator` uses template for common milestones, AI for custom
- [ ] All generators use caching with correct TTLs

### Phase H: Caching

- [ ] `CacheService` reads/writes `AiCache` table
- [ ] Cache keys follow convention: `{generatorType}:{...params}`
- [ ] TTL enforcement: expired entries not returned by `get()`
- [ ] Cache invalidation: `invalidate(pattern)` deletes matching keys
- [ ] Cohort cache working: same narrative/quest content served to similar users

---

## 8. NON-FUNCTIONAL REQUIREMENTS

### REQ-NFR-01: Latency

| Generator | P95 Latency Target |
|-----------|--------------------|
| Roadmap | < 15s (Sonnet, large output) |
| Narrative | < 8s (Haiku) |
| Quest Batch | < 5s (Haiku) |
| Assessment | < 8s (Haiku) |
| Recommendation | < 3s (Haiku, small output) |
| Fun Fact Batch | < 3s (Haiku) |
| Motivational | < 1s (Template) / < 3s (Haiku) |
| Quiz | < 3s (Haiku, single question) |
| Code Challenge | < 8s (Haiku/Sonnet) |

### REQ-NFR-02: Cost

- Per-user monthly target: < $0.25 with caching
- Per-user monthly hard cap: $2.00 (abort generation if exceeded)
- Admin alert: daily cost > $50 across all users

### REQ-NFR-03: Availability

- Graceful degradation: if Anthropic API is down, serve cached/template content
- No user-facing errors from AI failures — always fallback to something

### REQ-NFR-04: Security

- `ANTHROPIC_API_KEY` stored in env, never logged
- User input sanitized before embedding in prompts
- AI outputs filtered before serving to users
- `LlmTrace` records encrypted at rest (DB-level encryption) — contain full prompts with user data

### REQ-NFR-05: Observability

- Every AI call logged in `LlmUsage` (100% coverage)
- Admin endpoints: `ai.usage`, `ai.traces`, `ai.health` (Phase J or later)
- Error rate monitoring: alert if validation failure rate > 5% for any generator
- Cost anomaly detection: alert if per-user cost > $1/day

### REQ-NFR-06: Scalability

- Generators are stateless — can run on any API instance
- DB-backed cache works across multiple instances (no sticky sessions)
- `LlmUsage` table designed for high write throughput (indexed by time)
- Future: `LlmTrace` partitioned by month for retention management

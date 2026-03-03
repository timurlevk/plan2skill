# AI Service Wire-Up — Backend + Frontend Requirements

**Status:** DESIGN PHASE
**Depends on:** AI Service Phases A-D (completed, commit `74cf1c7`)
**Stack:** NestJS + tRPC + Next.js + Zustand + Zod
**Last updated:** 2026-03-04

---

## TABLE OF CONTENTS

1. [Current State](#1-current-state)
2. [Wire-Up Map](#2-wire-up-map)
3. [Phase E: NarrativeGenerator Wire-Up](#3-phase-e-narrativegenerator-wire-up)
4. [Phase F: QuestGenerator Wire-Up](#4-phase-f-questgenerator-wire-up)
5. [Phase G: AssessmentGenerator Wire-Up](#5-phase-g-assessmentgenerator-wire-up)
6. [Phase H: Admin Observability Dashboard](#6-phase-h-admin-observability-dashboard)
7. [Phase I: Real-Time Generation Progress (SSE)](#7-phase-i-real-time-generation-progress-sse)
8. [Phase J: Skill Elo + Adaptive Difficulty](#8-phase-j-skill-elo--adaptive-difficulty)
9. [Frontend Store Changes](#9-frontend-store-changes)
10. [tRPC Endpoint Summary](#10-trpc-endpoint-summary)
11. [File Map](#11-file-map)
12. [Implementation Order & Dependencies](#12-implementation-order--dependencies)
13. [Risk Matrix](#13-risk-matrix)

---

## 1. CURRENT STATE

### 1.1 What's Wired (Phases A-D)

```
AI Infrastructure (core/)
├── LlmClient          ← single Anthropic SDK import, retry + fallback + timeout
├── LlmTracer          ← fire-and-forget LlmUsage + LlmTrace writes
├── CacheService       ← DB-backed TTL cache with probabilistic cleanup
├── ContextEnrichment  ← 6 parallel Prisma queries, per-generator budgets
├── ContentSafety      ← input injection filter + output blocklist scan
└── BaseGenerator      ← sealed 10-step generate() pipeline

Generators
└── RoadmapGenerator   ← extends BaseGenerator, ModelTier.QUALITY

Wire-Up
├── roadmap.service.ts      → RoadmapGenerator.generate() ✓
├── roadmap.module.ts       → RoadmapGenerator registered ✓
├── narrative.service.ts    → LlmClient.call() direct (no generator) ✓
├── trpc.router.ts          → roadmap.generate → RoadmapService ✓
└── /roadmap/new (frontend) → trpc.roadmap.generate mutation ✓
```

### 1.2 What's NOT Wired

| Area | Status | Issue |
|------|--------|-------|
| NarrativeGenerator | Missing | narrative.service calls LlmClient directly, no Zod validation, no tracing |
| QuestGenerator | Missing | quest.service returns hardcoded templates, no AI generation |
| AssessmentGenerator | Missing | onboarding uses static question bank (`assessment-questions.ts`), no adaptive AI |
| Admin LLM Dashboard | Missing | LlmUsage/LlmTrace tables exist but no read endpoints |
| Real-time generation progress | Missing | Frontend fakes 5s animation, no SSE/WebSocket from backend |
| Skill Elo updates | Missing | SkillElo table exists but never written to |
| Context enrichment feedback | Missing | No visibility into what context was injected into prompts |

### 1.3 Current End-to-End Flows

**Roadmap generation (FULLY WIRED):**
```
User clicks "Forge Quest Line" → 3-step wizard (goal/pace/forge)
  → trpc.roadmap.generate.useMutation()
  → RoadmapService.generateRoadmap()
  → RoadmapGenerator.generate(userId, input)
    → ContextEnrichment.build() → ContentSafety.filterInput()
    → LlmClient.call(QUALITY) → Zod validate → ContentSafety.filterOutput()
    → LlmTracer.trackSuccess() → return AiRoadmapResult
  → Create milestones + tasks in DB
  → MiniForge animation (fake 5s) → redirect to /roadmap
```

**Narrative generation (PARTIALLY WIRED — admin only, no generator):**
```
Admin clicks "Generate Batch" → trpc.narrative.generateBatch
  → NarrativeService.generateEpisodeBatch()
  → LlmClient.call(QUALITY) directly (no BaseGenerator pipeline)
  → JSON.parse() as T (no Zod, no tracing, no safety filter)
  → Word count gate → Episode.create() → admin review queue
```

**Quest completion (NO AI — static templates):**
```
User opens daily quest → QuestCardModal shows hardcoded knowledgeCheck
  → quest.validate → QuestService.validateCompletion() (static check)
  → progression.completeTask → XP + loot
```

---

## 2. WIRE-UP MAP

### Full target architecture after Phases E-J:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /roadmap/new      ──→ trpc.roadmap.generate (existing)            │
│  /roadmap/[id]     ──→ SSE: roadmap.progress (NEW Phase I)         │
│  /home (DailyQuests)──→ trpc.quest.generateDaily (NEW Phase F)     │
│  /onboarding/quiz  ──→ trpc.assessment.generate (NEW Phase G)      │
│  /admin/narrative   ──→ trpc.narrative.generateBatch (existing)     │
│  /admin/ai-ops      ──→ trpc.admin.llmUsage (NEW Phase H)          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                       tRPC ROUTER (trpc.router.ts)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  roadmap.generate     → RoadmapService     → RoadmapGenerator      │
│  narrative.genBatch   → NarrativeService   → NarrativeGenerator    │
│  quest.generateDaily  → QuestService       → QuestGenerator        │
│  assessment.generate  → AssessmentService  → AssessmentGenerator   │
│  admin.llmUsage       → AdminAiService     → Prisma (LlmUsage)    │
│  admin.llmCosts       → AdminAiService     → Prisma (LlmUsage)    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        GENERATOR LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RoadmapGenerator      (QUALITY,  temp=0.7, 4096 tok) ← existing   │
│  NarrativeGenerator    (QUALITY,  temp=0.8, 2048 tok) ← Phase E    │
│  QuestGenerator        (BALANCED, temp=0.6, 2048 tok) ← Phase F    │
│  AssessmentGenerator   (BALANCED, temp=0.4, 2048 tok) ← Phase G    │
│                                                                     │
│  All extend BaseGenerator → sealed 10-step pipeline                 │
│  All get context via ContextEnrichmentService                       │
│  All traced via LlmTracer → LlmUsage + LlmTrace tables             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                      PRISMA (PostgreSQL)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LlmUsage  — cost tracking, latency, success rate per generator     │
│  LlmTrace  — full prompt/response for debugging (opt-in)            │
│  SkillElo  — per-user per-skill Elo rating (adaptive difficulty)    │
│  AiCache   — TTL-based result caching with hit counting             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. PHASE E: NarrativeGenerator Wire-Up

### 3.1 Problem

`NarrativeService.generateEpisodeBatch()` calls `LlmClient.call()` directly — bypassing BaseGenerator's:
- Context enrichment (no user/season context budget)
- Zod validation (raw `JSON.parse() as T`)
- Output safety filter (no blocklist check)
- Tracing (no LlmUsage row created)
- Caching (no episode dedup)

### 3.2 Backend Changes

**New file:** `apps/api/src/ai/generators/narrative.generator.ts`

```
NarrativeGenerator extends BaseGenerator<NarrativeGeneratorInput, AiEpisodeResult>
├── generatorType = 'narrative'
├── modelTier = ModelTier.QUALITY (Sonnet — creative writing needs quality)
├── temperature = 0.8 (higher creativity for fiction)
├── maxTokens = 2048
├── outputSchema = AiEpisodeSchema (from schemas/narrative.schema.ts)
├── buildSystemPrompt(context):
│   - Inject story bible (world rules, characters, geography, tone guide)
│   - Inject season arc outline + state tracker
│   - Inject narrative context (current season, last episode, narrative mode)
│   - Character context for personalization
├── buildUserPrompt(input, context):
│   - Episode number, recent summaries, constraints
│   - Category target (standard/climax/lore_drop/season_finale)
└── getCacheKey(): null (episodes should never be cached — unique each time)
```

**Input type:**
```typescript
interface NarrativeGeneratorInput {
  seasonId: string;
  episodeNumber: number;
  globalNumber: number;
  recentSummaries: Array<{ episodeNumber: number; summary: string }>;
  stateTracker: SeasonStateTracker;
  storyBible: { worldName: string; worldRules: unknown; characters: unknown; geography: unknown };
  category?: string;
}
```

**Modify:** `apps/api/src/narrative/narrative.service.ts`
- Replace direct `llmClient.call()` with `this.narrativeGenerator.generate()`
- Remove manual `JSON.parse() as T` — BaseGenerator handles parsing + Zod
- Add word count quality gate AFTER generator returns (post-validation hook)
- Keep admin-only context (no user context for admin-generated episodes → pass system userId)

**Modify:** `apps/api/src/narrative/narrative.module.ts`
- Add `NarrativeGenerator` to providers

### 3.3 Frontend Changes

None — admin UI (`/admin/narrative`) already has Generate Batch button wired to `trpc.narrative.generateBatch`. The only change is better error messages when Zod validation rejects an episode.

### 3.4 Tracing Benefit

After wire-up, every generated episode will have:
- `LlmUsage` row: cost, latency, model used, success/failure
- `LlmTrace` row (if `LLM_TRACE_FULL=true`): full system prompt, story bible context, generated text

---

## 4. PHASE F: QuestGenerator Wire-Up

### 4.1 Problem

Current quest system is **entirely static**:
- `QuestService.getDailyQuests()` returns tasks from the roadmap's milestone (pre-generated by RoadmapGenerator)
- `knowledgeCheck` field on Task is either null or AI-generated during roadmap creation
- No dynamic quest generation based on user's current skill level, preferred types, or Elo rating
- Hardcoded quest templates in `apps/web/app/(dashboard)/home/_utils/quest-templates.ts` (frontend-only)

### 4.2 Backend Changes

**New file:** `apps/api/src/ai/generators/quest.generator.ts`

```
QuestGenerator extends BaseGenerator<QuestGeneratorInput, AiQuestBatch>
├── generatorType = 'quest'
├── modelTier = ModelTier.BALANCED (Haiku — high volume, lower cost)
├── temperature = 0.6
├── maxTokens = 2048
├── outputSchema = AiQuestBatchSchema (from schemas/quest.schema.ts)
├── cacheTtlSeconds = 3600 (1 hour — same skill domain reuses)
├── buildSystemPrompt(context):
│   - Flow state distribution: 70% mastery, 20% stretch, 10% review
│   - Bloom's level targeting based on skill Elo
│   - Task type mix based on user's preferred types
│   - Difficulty calibration from performance context
├── buildUserPrompt(input, context):
│   - Skill domain, target Bloom's level, quest count
│   - Recent completions to avoid repetition
│   - Daily minutes constraint
└── getCacheKey(input, context):
    - Hash of: userId + skillDomain + bloomLevel + date
    - 1-hour TTL prevents regeneration spam
```

**Input type:**
```typescript
interface QuestGeneratorInput {
  skillDomain: string;
  milestoneId: string;
  count: number;           // 3-5 quests per batch
  dailyMinutes: number;
  existingTaskTitles: string[];  // avoid repetition
}
```

**Modify:** `apps/api/src/quest/quest.service.ts`
- Add new method `generateDailyQuests(userId)`:
  1. Find active roadmap + active milestone
  2. Determine skill domains from milestone tasks
  3. Call `QuestGenerator.generate()` for each domain
  4. Persist generated quests as Task rows (status='available')
  5. Return generated tasks

**Modify:** `apps/api/src/quest/quest.module.ts`
- Import AiModule
- Add QuestGenerator to providers

**New tRPC endpoint:** `quest.generateDaily`
```typescript
questRouter.generateDaily: protectedProcedure.mutation(({ ctx }) => {
  return this.questService.generateDailyQuests(ctx.userId);
})
```

### 4.3 Frontend Changes

**Modify:** `apps/web/app/(dashboard)/home/_components/DailyQuests.tsx`
- Add "Refresh Quests" button that calls `trpc.quest.generateDaily.useMutation()`
- Show loading state while AI generates
- After generation, refetch `trpc.quest.daily.useQuery()` to display new quests

**Modify:** `apps/web/app/(dashboard)/home/_components/QuestCardModal.tsx`
- Display `bloomLevel` badge on quest cards (remember/understand/apply/analyze/evaluate/create)
- Display `flowCategory` indicator (stretch=orange, mastery=green, review=blue)
- Display `skillDomain` tag

**Delete (eventually):** `apps/web/app/(dashboard)/home/_utils/quest-templates.ts`
- Frontend quest templates become unnecessary once AI generates all quests

### 4.4 Cost Consideration

- QuestGenerator uses `ModelTier.BALANCED` (Haiku) — $0.80/1M input, $4.00/1M output
- Estimated ~500 tokens per quest batch → ~$0.003 per generation
- With 1-hour cache per skill domain → max ~5 generations/user/day → ~$0.015/user/day
- Well within $0.25/user/month target

---

## 5. PHASE G: AssessmentGenerator Wire-Up

### 5.1 Problem

Onboarding skill assessment uses a **static question bank** (`assessment-questions.ts`):
- 28 hardcoded questions across 10 domains
- Simple difficulty tiers (1-3) with basic adaptive logic
- No Bloom's taxonomy, no distractor analysis, no Elo calibration
- Same questions for every user regardless of stated goal

### 5.2 Backend Changes

**New file:** `apps/api/src/ai/generators/assessment.generator.ts`

```
AssessmentGenerator extends BaseGenerator<AssessmentGeneratorInput, AiAssessment>
├── generatorType = 'assessment'
├── modelTier = ModelTier.BALANCED (Haiku — quiz gen is formulaic)
├── temperature = 0.4 (low creativity — factual questions)
├── maxTokens = 2048
├── outputSchema = AiAssessmentSchema (from schemas/assessment.schema.ts)
├── cacheTtlSeconds = 86400 (24 hours — same domain reuses question bank)
├── buildSystemPrompt(context):
│   - Target Bloom's level based on stated experience
│   - Distractor types: common_misconception, partial_knowledge, similar_concept, syntax_error
│   - Elo targeting: 800-1200 for beginners, 1200-1600 for intermediate, 1600-2000 for advanced
│   - Exactly 4 options per question, exactly 1 correct
├── buildUserPrompt(input, context):
│   - Skill domain, experience level, question count (5-10)
│   - User's stated goal for domain-specific questions
└── getCacheKey(input, context):
    - Hash of: skillDomain + experienceLevel
    - 24h TTL (question banks are reusable across users)
```

**Input type:**
```typescript
interface AssessmentGeneratorInput {
  skillDomain: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  goal: string;
  questionCount: number;  // 5-10
}
```

**New service:** `apps/api/src/assessment/assessment.service.ts`
```typescript
@Injectable()
export class AssessmentService {
  async generateAssessment(userId: string, input: AssessmentGeneratorInput): Promise<AiAssessment>;
  async submitAssessment(userId: string, answers: AssessmentAnswer[]): Promise<AssessmentResult>;
  // submitAssessment updates SkillElo for the user
}
```

**New module:** `apps/api/src/assessment/assessment.module.ts`

**New tRPC endpoints:**
```typescript
assessmentRouter = router({
  generate: protectedProcedure
    .input(z.object({
      skillDomain: z.string().max(50),
      experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      goal: z.string().max(500),
      questionCount: z.number().int().min(5).max(10).default(5),
    }))
    .mutation(({ ctx, input }) => {
      return this.assessmentService.generateAssessment(ctx.userId, input);
    }),
  submit: protectedProcedure
    .input(z.object({
      skillDomain: z.string().max(50),
      answers: z.array(z.object({
        questionIndex: z.number().int(),
        selectedIndex: z.number().int().min(0).max(3),
      })),
    }))
    .mutation(({ ctx, input }) => {
      return this.assessmentService.submitAssessment(ctx.userId, input);
    }),
})
```

### 5.3 Frontend Changes

**Modify:** Onboarding quiz flow
- Currently: `apps/web/app/(onboarding)/_data/assessment-questions.ts` (static 28 questions)
- Target: Call `trpc.assessment.generate.useMutation()` with user's selected goal + experience level
- Fallback: Keep static question bank as template fallback (`ModelTier.TEMPLATE` tier) when AI is unavailable

**New component hook:** `useAdaptiveAssessment.ts`
- Calls `assessment.generate` on mount
- Displays AI-generated questions in `QuizCardV2` component
- On submit, calls `assessment.submit` → receives Elo rating
- Store Elo in `useProgressionStore`

### 5.4 Elo Integration

After assessment submission:
1. Calculate initial Elo: `baseElo + (correctAnswers / total) * 400`
2. Write to `SkillElo` table via `prisma.skillElo.upsert()`
3. This Elo feeds back into `ContextEnrichmentService.build()` → used by RoadmapGenerator and QuestGenerator for difficulty calibration

---

## 6. PHASE H: Admin Observability Dashboard

### 6.1 Problem

LlmUsage and LlmTrace tables collect data but have zero read endpoints. No visibility into:
- Cost per user, per generator, per day
- Latency percentiles (p50, p95, p99)
- Error rates and failure reasons
- Cache hit ratios
- Model usage distribution

### 6.2 Backend Changes

**New service:** `apps/api/src/admin/admin-ai.service.ts`

```typescript
@Injectable()
export class AdminAiService {
  // Cost summary: total cost, cost per generator, cost per day (last 30d)
  async getCostSummary(days: number): Promise<CostSummary>;

  // Usage stats: call count, avg latency, error rate per generator
  async getUsageStats(days: number): Promise<UsageStats>;

  // Recent errors: last N failures with trace data
  async getRecentErrors(limit: number): Promise<ErrorTrace[]>;

  // Cache stats: hit rate per generator
  async getCacheStats(): Promise<CacheStats>;

  // Per-user costs: top N users by cost (for abuse detection)
  async getTopUsersByCost(days: number, limit: number): Promise<UserCostEntry[]>;
}
```

**New module:** `apps/api/src/admin/admin-ai.module.ts`

**New tRPC endpoints** (admin-only, add role guard):
```typescript
adminRouter = router({
  llmCosts: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(({ input }) => this.adminAiService.getCostSummary(input.days)),

  llmUsage: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(({ input }) => this.adminAiService.getUsageStats(input.days)),

  llmErrors: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(({ input }) => this.adminAiService.getRecentErrors(input.limit)),

  llmCacheStats: adminProcedure.query(() => this.adminAiService.getCacheStats()),

  llmTopUsers: adminProcedure
    .input(z.object({
      days: z.number().int().min(1).max(90).default(30),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(({ input }) => this.adminAiService.getTopUsersByCost(input.days, input.limit)),
})
```

### 6.3 Frontend Changes

**New page:** `apps/web/app/(admin)/ai-ops/page.tsx`

Layout (4 cards):

```
┌────────────────────────┬────────────────────────┐
│  Total Cost (30d)      │  Total Calls (30d)     │
│  $12.47                │  4,231                 │
│  ▓▓▓▓▓░░ trend graph   │  ▓▓▓▓▓░░ trend graph   │
├────────────────────────┼────────────────────────┤
│  Avg Latency           │  Error Rate            │
│  2.3s (p95: 8.1s)     │  1.2% (51 failures)    │
│  ▓▓▓▓▓░░ trend graph   │  ▓▓░░░░░ trend graph   │
└────────────────────────┴────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Cost by Generator (pie chart)                    │
│  roadmap: $8.20 (65.7%)                          │
│  narrative: $3.10 (24.9%)                        │
│  quest: $0.87 (7.0%)                             │
│  assessment: $0.30 (2.4%)                        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Recent Errors (table)                            │
│  Time | Generator | Model | Error | Prompt (...)  │
│  ...                                              │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Top Users by Cost (table)                        │
│  User | Calls | Cost | Avg Latency                │
│  ...                                              │
└──────────────────────────────────────────────────┘
```

**Modify:** `apps/web/app/(admin)/layout.tsx`
- Add "AI Ops" link to sidebar under "Analyze" section
- Route: `/admin/ai-ops`

---

## 7. PHASE I: Real-Time Generation Progress (SSE)

### 7.1 Problem

Current roadmap generation uses a **fake 5-second animation** (`MiniForge.tsx`) that doesn't reflect actual AI progress. User has no idea if generation takes 3s or 30s. If it fails, the user sees success animation followed by confusion.

### 7.2 Backend Changes

**New file:** `apps/api/src/roadmap/roadmap.gateway.ts` (NestJS SSE controller)

```typescript
@Controller('api/roadmap')
export class RoadmapGateway {
  @Sse('progress/:roadmapId')
  streamProgress(@Param('roadmapId') roadmapId: string): Observable<MessageEvent> {
    // Poll roadmap status every 2s, emit SSE events:
    // { type: 'progress', data: { phase: 'context', percent: 10, message: 'Building hero context...' } }
    // { type: 'progress', data: { phase: 'generating', percent: 40, message: 'Forging milestones...' } }
    // { type: 'milestone', data: { index: 0, title: 'Week 1-2: Foundations', taskCount: 8 } }
    // { type: 'complete', data: { roadmapId } }
    // { type: 'error', data: { message: 'Generation failed, retrying...' } }
  }
}
```

**Modify:** `apps/api/src/roadmap/roadmap.service.ts`
- Add `EventEmitter2` injection for progress events
- Emit events at each stage of `generateWithAi()`:
  - Before context enrichment
  - Before LLM call
  - After each milestone created
  - On completion/error

### 7.3 Frontend Changes

**Modify:** `apps/web/app/(dashboard)/roadmap/new/_components/MiniForge.tsx`
- Replace fake 5s timer with real SSE connection to `/api/roadmap/progress/:id`
- Map SSE events to existing animation phases
- Show actual milestone names as they're created
- Handle error events with retry UI
- Keep fake animation as fallback if SSE connection fails

**New hook:** `useForgeProgress.ts`
```typescript
function useForgeProgress(roadmapId: string | null) {
  // EventSource connection to SSE endpoint
  // Returns: { phase, percent, message, milestones[], isComplete, error }
}
```

---

## 8. PHASE J: Skill Elo + Adaptive Difficulty

### 8.1 Problem

`SkillElo` table exists (created in Phase A) but is never written to or read from. Without Elo data:
- QuestGenerator can't calibrate difficulty
- AssessmentGenerator can't target questions
- ContextEnrichmentService returns empty `skillElos` array
- No ZPD (Zone of Proximal Development) targeting

### 8.2 Backend Changes

**New service:** `apps/api/src/skill-elo/skill-elo.service.ts`

```typescript
@Injectable()
export class SkillEloService {
  // Update Elo after quest completion (based on quality score + difficulty)
  async updateAfterQuest(userId: string, skillDomain: string, quality: number, difficulty: number): Promise<void>;

  // Update Elo after assessment (batch update from multiple questions)
  async updateAfterAssessment(userId: string, skillDomain: string, results: QuestionResult[]): Promise<void>;

  // Get user's Elo for a domain (with default 1200)
  async getElo(userId: string, skillDomain: string): Promise<number>;

  // Get all Elos for a user (for context enrichment)
  async getAllElos(userId: string): Promise<SkillElo[]>;
}
```

**Elo algorithm** (standard Elo with K-factor):
```
K = 32 (fast adaptation for learning platform)
Expected = 1 / (1 + 10^((questionElo - userElo) / 400))
Actual = quality / maxQuality  // 0.0 - 1.0
NewElo = userElo + K * (Actual - Expected)
Clamp to [800, 2000]
```

**Wire into existing services:**
- `ProgressionService.completeTask()` → call `skillEloService.updateAfterQuest()`
- `AssessmentService.submitAssessment()` → call `skillEloService.updateAfterAssessment()`
- `ContextEnrichmentService.build()` → already reads `skillElo` table (no change needed)

### 8.3 Frontend Changes

**Modify:** `apps/web/app/(dashboard)/home/_components/MasteryRing.tsx`
- Show actual Elo rating per skill domain instead of generic mastery level
- Map Elo ranges to visual tiers: Novice (800-999), Apprentice (1000-1199), Journeyman (1200-1399), Expert (1400-1599), Master (1600+)

**Add to server hydration** (`useServerHydration.ts`):
- New query: `review.mastery` already returns mastery data; extend to include Elo from SkillElo table
- Or add dedicated `skillElo.list` query

---

## 9. FRONTEND STORE CHANGES

### 9.1 New Store: `useAiStore` (admin only)

```typescript
// packages/store/src/ai.store.ts
interface AiStoreState {
  costSummary: CostSummary | null;
  usageStats: UsageStats | null;
  recentErrors: ErrorTrace[];
  cacheStats: CacheStats | null;
}
```

### 9.2 Modify: `useProgressionStore`

Add fields:
```typescript
skillElos: Array<{ skillDomain: string; elo: number; tier: string }>;
```

### 9.3 Modify: `useRoadmapStore`

Add fields:
```typescript
forgeProgress: {
  phase: string;
  percent: number;
  message: string;
  milestones: Array<{ title: string; taskCount: number }>;
  isComplete: boolean;
  error: string | null;
} | null;
```

---

## 10. tRPC ENDPOINT SUMMARY

### New Endpoints (8 endpoints across 2 new routers)

| Router | Procedure | Type | Phase | Auth |
|--------|-----------|------|-------|------|
| `assessment.generate` | mutation | G | user |
| `assessment.submit` | mutation | G | user |
| `quest.generateDaily` | mutation | F | user |
| `admin.llmCosts` | query | H | admin |
| `admin.llmUsage` | query | H | admin |
| `admin.llmErrors` | query | H | admin |
| `admin.llmCacheStats` | query | H | admin |
| `admin.llmTopUsers` | query | H | admin |

### Modified Endpoints (0 — existing endpoints stay the same)

No existing endpoint signatures change. Existing clients unaffected.

---

## 11. FILE MAP

### New Files (13)

| # | File | Phase | Purpose |
|---|------|-------|---------|
| 1 | `ai/generators/narrative.generator.ts` | E | NarrativeGenerator extends BaseGenerator |
| 2 | `ai/generators/quest.generator.ts` | F | QuestGenerator extends BaseGenerator |
| 3 | `ai/generators/assessment.generator.ts` | G | AssessmentGenerator extends BaseGenerator |
| 4 | `assessment/assessment.service.ts` | G | Generate + submit assessments, Elo update |
| 5 | `assessment/assessment.module.ts` | G | Module registration |
| 6 | `admin/admin-ai.service.ts` | H | LlmUsage/Trace aggregation queries |
| 7 | `admin/admin-ai.module.ts` | H | Module registration |
| 8 | `roadmap/roadmap.gateway.ts` | I | SSE endpoint for generation progress |
| 9 | `skill-elo/skill-elo.service.ts` | J | Elo calculation + persistence |
| 10 | `skill-elo/skill-elo.module.ts` | J | Module registration |
| 11 | `apps/web/.../ai-ops/page.tsx` | H | Admin AI observability dashboard |
| 12 | `apps/web/.../_hooks/useForgeProgress.ts` | I | SSE hook for generation progress |
| 13 | `apps/web/.../_hooks/useAdaptiveAssessment.ts` | G | AI assessment flow hook |

### Modified Files (12)

| # | File | Phase | Change |
|---|------|-------|--------|
| 1 | `narrative/narrative.service.ts` | E | Replace LlmClient.call → NarrativeGenerator.generate |
| 2 | `narrative/narrative.module.ts` | E | Add NarrativeGenerator to providers |
| 3 | `quest/quest.service.ts` | F | Add generateDailyQuests() method |
| 4 | `quest/quest.module.ts` | F | Import AiModule, add QuestGenerator |
| 5 | `trpc/trpc.router.ts` | F,G,H | Add assessment, quest.generateDaily, admin routers |
| 6 | `trpc/trpc.module.ts` | G,H,J | Import AssessmentModule, AdminAiModule, SkillEloModule |
| 7 | `roadmap/roadmap.service.ts` | I | Add EventEmitter progress events |
| 8 | `progression/progression.service.ts` | J | Call skillEloService.updateAfterQuest |
| 9 | `apps/web/(admin)/layout.tsx` | H | Add "AI Ops" sidebar link |
| 10 | `apps/web/.../DailyQuests.tsx` | F | Add refresh quests button |
| 11 | `apps/web/.../QuestCardModal.tsx` | F | Show bloomLevel, flowCategory, skillDomain |
| 12 | `apps/web/.../MiniForge.tsx` | I | Replace fake timer with SSE |

---

## 12. IMPLEMENTATION ORDER & DEPENDENCIES

```
Phase E (NarrativeGenerator)     ──┐
Phase F (QuestGenerator)         ──┼── can run in parallel
Phase G (AssessmentGenerator)    ──┤
Phase H (Admin Dashboard)        ──┘
                                   │
                                   ▼
Phase I (SSE Progress)           ── independent, can run anytime
                                   │
                                   ▼
Phase J (Skill Elo)              ── depends on G (assessment submit writes Elo)
                                       depends on F (quest complete writes Elo)
```

### Recommended order:

| Order | Phase | Days | Reason |
|-------|-------|------|--------|
| 1 | E (Narrative) | 1 | Smallest change — just extract existing code into generator |
| 2 | H (Admin Dashboard) | 1-2 | High visibility, helps debug remaining phases |
| 3 | F (Quest) | 2 | Core UX improvement, quests become dynamic |
| 4 | G (Assessment) | 2 | Feeds Elo data for Phase J |
| 5 | J (Skill Elo) | 1 | Connects assessment → quest difficulty loop |
| 6 | I (SSE) | 1-2 | Polish, improves UX but not critical |

**Total estimate: 8-10 days core work**

---

## 13. RISK MATRIX

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| LLM latency spikes (>30s) | High — UX blocked | Medium | ModelTier fallback chain + timeout + SSE progress |
| Zod validation rejects valid AI output | Medium — generation fails | Medium | Relaxed schemas (.min(1) not .min(10)), log raw text in LlmTrace |
| Cost blowout from quest generation | High — bills | Low | BALANCED tier (Haiku), 1h cache, daily generation cap per user |
| Prompt injection via user goal text | High — safety | Low | ContentSafetyService.filterInput() already strips injection patterns |
| Cache staleness (stale quests) | Low — UX | Medium | Short TTL (1h), invalidate on roadmap change |
| SkillElo cold start (new users = 1200) | Low — bad difficulty | High | First assessment calibrates from 1200, K=32 converges fast (~10 questions) |
| Admin dashboard N+1 queries | Medium — DB load | Medium | Aggregate queries with GROUP BY, materialized views for heavy reports |

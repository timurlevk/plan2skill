# Plan2Skill — Context Architecture Gap Analysis
## Vision vs Best Practices vs Current Implementation

---

## 1. CONTEXT LAYER COMPARISON

### 1.1 Industry Standard (5-Layer Model)

Всі провідні EdTech платформи (Duolingo, Khan Academy, Knewton, Squirrel AI) використовують **5-шарову модель контексту**:

| Layer | Опис | Приклад | Частота зміни |
|-------|------|---------|--------------|
| **L0: Domain Model** | Граф навичок, бібліотека контенту, калібрування складності | Bloom's taxonomy, skill prerequisites | Тільки при деплої |
| **L1: Learner Profile** | Ймовірнісна модель знань по кожному скілу, преференції, стиль навчання | Elo per skill, archetype, learning pace | Повільно (щоденно) |
| **L2: Roadmap/Course** | Позиція в курсі, пройдені майлстоуни, активні цілі | Active milestone, roadmap goal, progress % | Між-сесійний |
| **L3: Session** | Спроби, хінти, помилки, час, стрік в поточній сесії | Attempts this session, hints used, time on task | Поточна сесія |
| **L4: Interaction** | Поточна вправа, відповідь студента, миттєвий фідбек | Current quiz question, submitted answer | Поточний хід |

### 1.2 User's Vision (4-Layer Model)

| Layer | Опис | Mapped to Industry |
|-------|------|--------------------|
| **Roadmap Context** | Все з онбордінгу (goal, assessments, interests) + згенеровані milestone + всі квести (назви, XP, до якого milestone ведуть) | L1 + L2 combined |
| **Quest-Level Context** | Детальна інформація всередині квеста: навчальний контент, fun-facts, AI tips, варіанти відповідей, кожна спроба юзера | L3 + L4 combined |
| **Ledger Layer** | Все що AI вважає важливим: типові помилки, кількість спроб, патерни | L1 (enriched) |
| **Cross-Roadmap Sharing** (TBD) | Шарінг контексту між різними roadmaps | Industry: transfer coefficients |

### 1.3 Current Implementation (Flat Context)

| What Exists | What's Missing |
|-------------|----------------|
| `UserProfileContext` (level, XP, tier, locale) | No roadmap-level context |
| `LearningContext` (streak, skillElos, recentCompletions) | No milestone context |
| `CharacterContext` (archetype, attributes) | No quest-level context |
| `PerformanceContext` (timeRatio, completionRate) | No ledger/attempt history |
| `NarrativeContext` (season, episode, mode) | No onboarding data post-onboarding |
| | No cross-roadmap sharing |

---

## 2. GAP ANALYSIS — Layer by Layer

### 2.1 ROADMAP CONTEXT LAYER

**User's Vision:** Єдиний контекст що містить: onboarding data + milestones + всі квести з лінками до milestones.

**Best Practice (Knewton, Squirrel AI):**
- Skill prerequisite graph (DAG) — кожен скіл має prerequisites
- Course position tracking — де юзер зараз у навчальному плані
- Goal alignment — кожен контент пов'язаний з кінцевою ціллю
- Duolingo: кожна лексема має зв'язок до концепту → модуля → курсу

**Current State:**
- `OnboardingSubmission` зберігає: intent, dreamGoal, domain, interests, careerTarget, assessments, milestones
- **After onboarding, this data is NEVER queried by ContextEnrichmentService** ← CRITICAL GAP
- `Roadmap` model має goal, title, dailyMinutes — але не передається в quest/assessment generators
- `Milestone` має title, weekStart/weekEnd, order — але quest generator отримує тільки `skillDomain`, не milestone context
- **`getDailyQuests()` використовує `flatMap()` що повністю знищує milestone hierarchy** ← CRITICAL GAP

**Gaps:**

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| R1 | OnboardingSubmission data не використовується після онбордінгу | HIGH | AI не знає user's dream goal, interests, career target при генерації квестів |
| R2 | Roadmap.goal не передається в quest/assessment generators | HIGH | Квести генеруються у вакуумі без зв'язку з кінцевою ціллю |
| R3 | Milestone context (title, description, order) втрачається при getDailyQuests() | HIGH | Dashboard показує flat tasks замість milestone progression |
| R4 | Немає skill prerequisite graph (DAG) | MEDIUM | AI не може визначити оптимальний порядок вивчення скілів |
| R5 | Квести не мають explicit зв'язку з milestone learning objectives | HIGH | AI генерує generic tasks замість milestone-aligned content |

---

### 2.2 QUEST-LEVEL CONTEXT LAYER

**User's Vision:** Всередині квесту зберігати: навчальний контент, fun-fact, AI tip, варіанти відповідей, кожна спроба юзера.

**Best Practice (Khan Academy Khanmigo, PAPPL):**
- Khanmigo: завжди спочатку retrievе human-generated hints/solutions, потім LLM генерує на їх основі
- PAPPL Multi-Layer: context of the question + instructor notes + student error history + constraints → one prompt
- Duolingo: кожна відповідь одразу впливає на Birdbrain model (14ms latency)
- Session state machine: question → answer → feedback → next_action (hint/retry/advance/explain)

**Current State:**
- `Task` model зберігає: title, description, taskType, xpReward, rarity, difficultyTier, validationType, knowledgeCheck
- `knowledgeCheck` (JSON blob) — має quiz question + options + correct answer
- `QuestCompletion` зберігає: questType, qualityScore, timeSpentSeconds
- **НЕ зберігається:** яку відповідь дав юзер, скільки спроб, які hints використав, час на кожне питання

**Gaps:**

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| Q1 | Немає моделі QuestAttempt/TaskAttempt | HIGH | AI не знає які помилки робить юзер, не може адаптувати складність |
| Q2 | Немає збереження user's answers (правильних і неправильних) | HIGH | Неможливо будувати error pattern analysis |
| Q3 | Немає hint tracking (які підказки показані) | MEDIUM | AI не може уникати повторення тих самих hints |
| Q4 | Fun-facts і AI tips не зберігаються як окремі entities | LOW | Неможливо уникати дублювання fun-facts |
| Q5 | Немає session state machine (question → answer → feedback → next) | MEDIUM | Кожна взаємодія — isolated, немає multi-turn within quest |
| Q6 | knowledgeCheck — одне питання per task, no progressive difficulty | MEDIUM | Квест або пройдений, або ні — немає градації розуміння |

---

### 2.3 LEDGER LAYER

**User's Vision:** AI-curated layer: типові помилки, кількість спроб, патерни що AI вважає важливими.

**Best Practice:**
- Duolingo HLR: `p = 2^(-delta/h)` — half-life regression для кожного концепту
- FSRS (Free Spaced Repetition Scheduler): state-of-art, open-source, tracks Difficulty, Stability, Retrievability per item
- Deep Knowledge Tracing (DKT): LSTM що предсказує P(correct) на наступну вправу
- Carnegie Learning: "learner ledger" — attempt count, error type classification, time-on-task, hint requests

**Current State:**
- `SkillElo` — Elo rating per skill domain (adjusts after each quest completion)
- `ReviewItem` — spaced repetition seed (skillDomain, masteryLevel, nextReview, easinessFactor)
- `Streak` — currentStreak, longestStreak
- `QuestCompletion` — qualityScore (single number), timeSpentSeconds
- **SkillElo.assessmentCount** exists but NOT used in context
- **ReviewItem** exists but is **NEVER queried by ContextEnrichmentService** ← CRITICAL GAP

**Gaps:**

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| L1 | ReviewItem not used in AI context | HIGH | AI doesn't know which skills are due for review — spaced repetition is "write-only" |
| L2 | No error type classification | HIGH | AI can't identify misconception patterns (e.g., user confuses X with Y) |
| L3 | No per-concept tracking (only per-domain) | MEDIUM | SkillElo tracks "React" as one domain, not "useState" vs "useEffect" separately |
| L4 | qualityScore is a single number, no breakdown | MEDIUM | Can't distinguish "slow but correct" from "fast but wrong" |
| L5 | No AI-generated learner insights (LLM-based analysis of attempt patterns) | MEDIUM | Ledger is purely statistical, no semantic analysis of errors |
| L6 | SkillElo.assessmentCount not in context | LOW | AI doesn't know confidence level of Elo estimate |

---

### 2.4 CROSS-ROADMAP SHARING (TBD)

**User's Vision:** Шарінг контексту між roadmaps — TBD.

**Best Practice:**
- Near-transfer (JS → TS): coefficient 0.7-0.9 — works well
- Far-transfer (math → debugging): unreliable — most platforms don't implement
- Knewton: shared knowledge graph where concept X in Course A = concept X in Course B
- Duolingo: shared lexeme features across courses (Spanish word also primes Portuguese)

**Current State:**
- `SkillElo` is per-domain, not per-roadmap — already partially shared
- No explicit transfer coefficients
- No shared concept taxonomy

**Gaps:**

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| X1 | No transfer coefficient between related domains | LOW (v2) | User who learned JS doesn't get credit starting TS roadmap |
| X2 | No shared concept taxonomy across roadmaps | LOW (v2) | Each roadmap is isolated learning silo |
| X3 | SkillElo doesn't distinguish "assessed" vs "transferred" knowledge | LOW (v2) | Can't tell if user actually demonstrated skill or it was inferred |

---

## 3. CONTEXT BUDGET BUGS (Immediate Fixes)

5 generators reference context fields that are **stripped by the budget system** (GENERATOR_CONTEXT_BUDGETS in types.ts):

| Generator | Code References | Budget Delivers | Result |
|-----------|----------------|-----------------|--------|
| QuizGenerator | `context.learningContext?.skillElos` | `['userProfile']` only | skillElos ALWAYS undefined → generic quiz difficulty |
| RecommendationGenerator | `context.learningContext` | `['userProfile']` only | No streak/elo info → generic recommendations |
| MotivationalGenerator | `context.characterContext` | `['userProfile']` only | No archetype/character → generic messages |
| CodeChallengeGenerator | `context.learningContext?.skillElos` | `['userProfile']` only | No skill level → wrong difficulty |
| (fun-fact, resource) | Only `userProfile` | `['userProfile']` | Correct — no mismatch |

**Fix required in** `apps/api/src/ai/core/types.ts` lines 139-157.

---

## 4. ARCHETYPE BLUEPRINTS — Defined but Unused

`ARCHETYPE_BLUEPRINTS` (archetype-blueprints.ts) defines per-archetype:
- Quest mix distribution (knowledge %, practice %, creative %, boss %)
- Preferred Bloom's levels
- Narrative tone and motivational style

**This constant is NEVER imported or used by any generator.** Quest mix is random instead of archetype-aligned.

---

## 5. CACHING vs CONTEXT FRESHNESS

| Issue | Current State | Best Practice |
|-------|--------------|---------------|
| Cache invalidation on user action | `CacheService.invalidate()` exists but **never called** | Invalidate on: levelUp, questComplete, skillEloChange |
| Stale context in cached responses | 24h caches (assessment, quiz) may serve wrong difficulty after Elo change | Duolingo: invalidate learner context on EVERY exercise completion (5 min TTL max) |
| Prompt cache optimization | Anthropic cache_control headers supported but metadata not persisted | Persist cacheCreationInputTokens to track savings |

---

## 6. RECOMMENDED ARCHITECTURE — Aligned with User Vision + Best Practices

### 6.1 New Context Layers

```
┌─────────────────────────────────────────────────────────────┐
│  L0: DOMAIN MODEL (static, deploy-time)                     │
│  - Bloom's taxonomy levels                                  │
│  - Archetype blueprints (quest mix, motivational style)     │
│  - Skill prerequisite graph (TBD)                           │
│  - Template library (fallback content)                      │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  L1: LEARNER PROFILE (slow-changing)                        │
│  Current: level, XP, tier, locale, archetype, attributes,   │
│           streak, skillElos, avgQualityScore                │
│  Add: onboarding data (dreamGoal, interests, careerTarget), │
│       ReviewItem (due items, mastery levels),               │
│       assessmentCount (elo confidence)                      │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  L2: ROADMAP CONTEXT (inter-session)          ← USER VISION │
│  Current: (nothing — this layer doesn't exist!)             │
│  Add: roadmap.goal, roadmap.title, dailyMinutes,            │
│       all milestones (title, status, taskCount, order),     │
│       all quests (title, xpReward, milestoneId, status),    │
│       onboarding assessments per skill,                     │
│       roadmap progress %                                    │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  L3: QUEST-LEVEL CONTEXT (per-session)        ← USER VISION │
│  Current: (nothing — this layer doesn't exist!)             │
│  Add: current task content (title, description, type),      │
│       knowledgeCheck questions + options,                    │
│       fun-fact shown, AI tip shown,                         │
│       all user attempts (answer, correct?, timestamp),      │
│       hints requested, time spent per question,             │
│       session start time, energy remaining                  │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  L4: LEDGER LAYER (AI-curated)                ← USER VISION │
│  Current: SkillElo (basic), QuestCompletion (minimal)       │
│  Add: error type classification per concept,                │
│       misconception pairs (confuses X with Y),              │
│       attempt count per concept,                            │
│       LLM-generated learner insight summaries,              │
│       learning velocity (fast learner? slow but thorough?)  │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  L5: CROSS-ROADMAP (TBD)                      ← USER VISION │
│  Current: SkillElo is already cross-roadmap (per-domain)    │
│  Add: transfer coefficients for related domains,            │
│       shared concept taxonomy,                              │
│       aggregate learner profile across all roadmaps         │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Context Flow per Generator Type

```
roadmap.generate()
  Context: L1 (full) + L2 (if re-generating, include existing roadmap)
  Purpose: Create milestone structure aligned with dream goal

quest.generate()
  Context: L1 (skillElos, level) + L2 (milestone objectives, quest titles for dedup) + L4 (error patterns)
  Purpose: Generate quests that target weak areas within current milestone

assessment.generate()
  Context: L1 (skillElos) + L4 (misconception patterns)
  Purpose: Calibrate difficulty based on known weak spots

quiz.during_quest()
  Context: L1 (minimal) + L2 (milestone) + L3 (current answers, attempts) + L4 (error patterns)
  Purpose: Adaptive within-quest difficulty adjustment

motivational.generate()
  Context: L1 (archetype, streak) + L2 (progress towards goal) + L4 (recent struggles/wins)
  Purpose: Archetype-appropriate encouragement referencing actual progress

narrative.generate()
  Context: L1 (archetype, attributes) + L2 (milestone just completed) + Narrative state
  Purpose: Story episode that reflects actual learning achievement
```

### 6.3 Context Compression Strategy (for Token Budget)

**Best Practice:** Hybrid approach from research:

```
Recent items (last 2-3):  Full verbatim data
Older items (3-20):       Summarized (key fields only)
Historical (20+):         Extracted facts (error count, pattern labels)
```

**Applied to Plan2Skill:**

| Context Block | Full | Summary | Extract |
|---------------|------|---------|---------|
| Current milestone tasks | All fields | — | — |
| Locked milestone tasks | Title + XP only | — | — |
| Recent quest attempts (last 3) | All attempts + answers | — | — |
| Older quest completions (3-50) | — | qualityScore, timeRatio | — |
| Historical completions (50+) | — | — | avgQuality, errorRate, topErrors |
| Skill Elos | Top 5 full | Top 6-10 domain+elo only | — |
| Onboarding data | dreamGoal, interests | — | — |

---

## 7. PRIORITY ROADMAP

### Immediate Fixes (no architecture change needed)

| # | Task | File | Effort |
|---|------|------|--------|
| F1 | Fix 5 generator context budget mismatches | `ai/core/types.ts` | 10 min |
| F2 | Wire ARCHETYPE_BLUEPRINTS into quest generator | `generators/quest.generator.ts` | 30 min |
| F3 | Add OnboardingSubmission to ContextEnrichmentService | `ai/core/context-enrichment.service.ts` | 1 hr |
| F4 | Add ReviewItem data to LearningContext | `ai/core/context-enrichment.service.ts` | 30 min |
| F5 | Include milestone metadata in getDailyQuests() response | `quest/quest.service.ts` | 1 hr |
| F6 | Group quests by milestone (not skillDomain) on dashboard | `useQuestSystem.ts` + `DailyQuests.tsx` | 2 hr |

### Phase 1: Roadmap Context Layer (L2)

| # | Task | Effort |
|---|------|--------|
| P1.1 | Create `RoadmapContext` type with goal, milestones, quest summaries | 1 hr |
| P1.2 | Add `buildRoadmapContext()` to ContextEnrichmentService | 2 hr |
| P1.3 | Add `roadmapContext` to budget map for quest, assessment, recommendation generators | 30 min |
| P1.4 | Update quest generator prompts to reference milestone objectives | 1 hr |

### Phase 2: Quest-Level Context Layer (L3)

| # | Task | Effort |
|---|------|--------|
| P2.1 | New Prisma model: `TaskAttempt { taskId, userId, answer, isCorrect, hintUsed, timeSpentMs, attemptNumber, createdAt }` | 1 hr |
| P2.2 | Create `QuestSessionContext` type | 30 min |
| P2.3 | Track attempts on quest completion (modify progressionService) | 2 hr |
| P2.4 | Context agent prompt that selects relevant attempt data for LLM | 2 hr |

### Phase 3: Ledger Layer (L4)

| # | Task | Effort |
|---|------|--------|
| P3.1 | New Prisma model: `LearnerInsight { userId, conceptKey, insightType, data(JSON), confidence, createdAt, expiresAt }` | 1 hr |
| P3.2 | Post-quest analysis: after N completions, generate learner insight via BUDGET model | 3 hr |
| P3.3 | Error classification prompt: "Given these attempts, what misconceptions exist?" | 2 hr |
| P3.4 | Feed insights back into quest/assessment generators | 1 hr |

### Phase 4: Cross-Roadmap (TBD)
- Define transfer coefficient table for domain pairs
- Share LearnerInsights across roadmaps
- Aggregate profile endpoint

---

## 8. COMPARISON TABLE — All Three Perspectives

| Aspect | Best Practice | User Vision | Current State | Gap |
|--------|--------------|-------------|---------------|-----|
| **Context layers** | 5 layers (L0-L4) | 4 layers (Roadmap, Quest, Ledger, Cross) | 5 flat blocks (no hierarchy) | No layer hierarchy, no roadmap/quest/ledger layers |
| **Roadmap context** | Course position + goal alignment | All onboarding + milestones + quests | Not included in AI context | Missing entirely |
| **Quest-level context** | Per-interaction state machine | All content + attempts + answers | Single qualityScore after completion | No attempt tracking, no session state |
| **Learner ledger** | HLR/FSRS per-concept tracking + error classification | AI-curated error patterns + attempt counts | Basic SkillElo + unused ReviewItem | SkillElo is per-domain not per-concept; ReviewItem unused |
| **Cross-roadmap** | Transfer coefficients for near-domains | TBD | SkillElo partially shared | No transfer logic |
| **Archetype influence** | Persona-based content mix + tone | Character-driven narrative | ARCHETYPE_BLUEPRINTS defined but never used | Complete disconnect |
| **Onboarding data reuse** | Initial assessment → permanent learner model | Part of roadmap context | Stored in OnboardingSubmission, never queried again | Write-only after onboarding |
| **Spaced repetition** | FSRS/HLR feeding into content selection | Implicit in ledger layer | ReviewItem created but never read by AI | Write-only |
| **Context freshness** | Invalidate on every exercise completion | Implicit (always latest) | cache.invalidate() exists, never called | Stale caches possible for 24h |
| **Token budget management** | Sliding window + progressive summary + fact extraction | "agent prompt to select data" | Static budget map (include/exclude blocks) | No compression, no dynamic selection |
| **Misconception detection** | LECTOR (LLM semantic analysis of confused pairs) | "типові помилки" in ledger | Not implemented | Missing entirely |
| **Multi-turn within quest** | Khanmigo: dialogue → hint → rephrase → advance | Each attempt → answer data saved | Single question per task, binary pass/fail | No progressive interaction |
| **Model routing** | 70% cheap, 20% mid, 10% expensive | Implicit | QUALITY/BALANCED/BUDGET tiers exist | Correct, but quiz/recommendation/motivational misrouted due to budget bugs |

---

## 9. KEY TAKEAWAYS

### What We're Doing Right
1. **BaseGenerator pipeline** — solid 10-step architecture with safety, caching, observability
2. **SkillElo system** — real adaptive difficulty based on Elo, not binary pass/fail
3. **3-tier model routing** — cost optimization with QUALITY/BALANCED/BUDGET
4. **Cohort caching** — user-agnostic caches for assessments and quizzes save significant cost
5. **Template fallbacks** — graceful degradation when LLM fails
6. **Content safety** — input/output filtering against prompt injection and XSS

### What Needs Fixing NOW (Bugs)
1. **5 generators get wrong context** due to missing GENERATOR_CONTEXT_BUDGETS entries
2. **ARCHETYPE_BLUEPRINTS never used** — defined but disconnected
3. **Milestones invisible on dashboard** — flatMap destroys structure

### What's Missing (Architecture)
1. **Roadmap Context Layer** — biggest gap; AI generates content without knowing WHERE in the learning journey
2. **Quest-Level Tracking** — no attempt/answer history means AI can't learn from user's mistakes
3. **Ledger Layer** — no AI-curated error analysis means each session starts from scratch
4. **Context freshness** — stale caches not invalidated on user actions

### What Can Wait (v2)
1. **Cross-roadmap transfer** — useful but not critical for MVP
2. **Per-concept tracking** (beyond per-domain SkillElo) — high complexity, moderate benefit
3. **LLM-based context compression** — current context fits in token budgets
4. **FSRS integration** — ReviewItem exists, can be connected later

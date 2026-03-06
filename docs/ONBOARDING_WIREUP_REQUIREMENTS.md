# Onboarding Wizard — Wire-Up Gap Analysis & Requirements

> **Status:** IMPLEMENTED v1.0 — All 4 phases complete (O1-O4)
> **Date:** 2026-03-04
> **Based on:** Full audit of 8 onboarding pages, 6 backend endpoints, 2 stores, 9 mock data files
> **Goal:** Close 3 identified gaps + refactor orphaned state + harden data persistence

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Gap Analysis](#2-gap-analysis)
3. [Requirements by Gap](#3-requirements-by-gap)
4. [Orphaned State Cleanup](#4-orphaned-state-cleanup)
5. [Data Persistence Audit](#5-data-persistence-audit)
6. [Implementation Phases](#6-implementation-phases)
7. [Verification Checklist](#7-verification-checklist)

---

## 1. Current State Summary

### Wire-Up Status (Pre-Gaps)

| Page | Step | API Queries | API Mutations | Mock Fallback | Status |
|------|:----:|:-----------:|:-------------:|:-------------:|:------:|
| `/intent` | 1 | `onboarding.intents` | `user.completeOnboarding`* | `INTENTS` | ✅ |
| `/legend` | 1.5 | — | `narrative.completeLegend` | — | ✅ |
| `/goal/direct` | 2A | — | **NONE** | `milestone-templates` | 🔴 GAP-3 |
| `/goal/guided` | 2B | `onboarding.domains` | `onboarding.submitGoal` | `DOMAINS` | ✅ |
| `/goal/career` | 2C | `onboarding.careerData` | `onboarding.submitGoal` | `PAIN_POINTS`, `CAREER_TARGETS` | ⚠️ GAP-3b |
| `/assessment` | 3 | **NONE** | `onboarding.submitAssessment` | `QUESTIONS` (hardcoded) | 🔴 GAP-1 |
| `/character` | 4 | **NONE** | `character.create`, `user.completeOnboarding` | `ARCHETYPES` (hardcoded) | 🔴 GAP-2 |
| `/first-quest` | 5 | — | — | — | ✅ (redirect) |

`*` Only for "exploring" intent shortcut

### Backend Endpoints (6 implemented, 1 orphaned)

| # | Endpoint | Type | Consumed? |
|---|----------|------|:---------:|
| 1 | `onboarding.intents` | query | ✅ intent/page.tsx |
| 2 | `onboarding.domains` | query | ✅ goal/guided/page.tsx |
| 3 | `onboarding.careerData` | query | ✅ goal/career/page.tsx |
| 4 | `onboarding.archetypes` | query | 🔴 NOT consumed |
| 5 | `onboarding.submitAssessment` | mutation | ✅ assessment/page.tsx |
| 6 | `onboarding.submitGoal` | mutation | ⚠️ guided + career only |

---

## 2. Gap Analysis

### GAP-1: Assessment Questions — Hardcoded Mock Instead of API

**Severity:** Medium
**Location:** `apps/web/app/(onboarding)/assessment/page.tsx` lines 15-19

**Problem:**
- Assessment page imports `QUESTIONS` from `_data/assessment-questions.ts` (70+ hardcoded questions)
- Uses `getNextQuestion()` adaptive logic client-side
- Backend has `onboarding.archetypes` endpoint (returns from `ref_content`) but NO `assessmentQuestions` query
- Assessment questions are NOT localizable (hardcoded English only)
- Cannot add/update questions without code deploy

**Current Flow:**
```
Client mock (QUESTIONS) → adaptive logic → user answers → submitAssessment mutation
```

**Desired Flow:**
```
API query (locale) → client adaptive logic → user answers → submitAssessment mutation
           ↓ fallback
    Client mock (QUESTIONS)
```

**Backend Status:**
- `ref_content` table supports `entityType = 'assessment_question'` + `'assessment_option'` (per ONBOARDING_API_MIGRATION.md)
- `OnboardingContentService` can be extended with `getAssessmentQuestions(locale)` method
- Warm cache pattern already handles this entity type

---

### GAP-2: Archetypes — Backend Endpoint Orphaned, Frontend Hardcoded

**Severity:** Low-Medium
**Location:** `apps/web/app/(onboarding)/character/page.tsx` line 202

**Problem:**
- Backend `onboarding.archetypes` endpoint EXISTS and WORKS (line 525-529 of trpc.router.ts)
- Returns `ArchetypeOption[]` with `{ id, name, tagline, bestFor, icon, color, stats }`
- Frontend NEVER calls it — uses hardcoded `ARCHETYPES` from `_data/archetypes.ts`
- `inferredArchetypeId` store field exists but is **never set** during onboarding
- Character page always defaults to `'explorer'` archetype (line 202)
- No archetype selection UI exists — user has zero control

**Current Flow:**
```
assessment page → (NO inference) → character page → archetypeId = 'explorer' always
```

**Desired Flow:**
```
assessment page → infer archetype from responses → character page → show inferred + allow override
                                                          ↓ API call
                                                  onboarding.archetypes query
                                                          ↓ fallback
                                                  ARCHETYPES mock data
```

**Inference Logic (proposed):**
```
intent='know' + direct path → 'strategist' (structured planners)
intent='explore_guided' → 'explorer' (curiosity-driven)
intent='career' → 'builder' (hands-on career changers)
assessment.method='quiz' + level='advanced' → 'innovator' (high skill)
assessment.method='self_assessment' + level='beginner' → 'connector' (collaborative learners)
```

---

### GAP-3: Direct Path — No Backend Sync (submitGoal Missing)

**Severity:** Medium
**Location:** `apps/web/app/(onboarding)/goal/direct/page.tsx`

**Problem:**
- Direct path (`/goal/direct`) stores `dreamGoal` + `performanceGoals` in Zustand store only
- Does NOT call `onboarding.submitGoal` mutation — data stays in localStorage
- If user clears browser data or logs in on another device, direct-path goal data is LOST
- Guided + career paths both call `submitGoal` — inconsistency

**Sub-gap 3b: Career Path Missing `careerPains` in submitGoal:**
- Career page collects `careerPains` (up to 3 pain points) via `toggleCareerPain()`
- `submitGoal` mutation at line 271-278 does NOT include `careerPains` in payload
- Backend schema accepts `careerTarget` but NOT `careerPains`
- Data collected but never persisted to DB

**Current Flow (Direct):**
```
Dream input → milestone selection → store only (NO API call) → /assessment
```

**Desired Flow (Direct):**
```
Dream input → milestone selection → store + submitGoal mutation → /assessment
```

---

## 3. Requirements by Gap

### REQ-G1: Wire Assessment Questions to API

**Priority:** P1

#### G1.1: Add `getAssessmentQuestions()` to OnboardingContentService
- **File:** `apps/api/src/onboarding/onboarding-content.service.ts`
- Method: `async getAssessmentQuestions(domain: string, locale: string)`
- Queries `ref_content` where `entityType = 'assessment_question'` filtered by `data.domain = domain`
- Joins `assessment_option` entries via `parentId`
- Translates via `TranslationService` (question text, option text, NPC reactions)
- Returns: `AssessmentQuestion[]` matching frontend shape

#### G1.2: Add `assessmentQuestions` procedure to tRPC router
- **File:** `apps/api/src/trpc/trpc.router.ts` (inside `onboardingRouter`)
- Type: `query` (public — questions aren't sensitive)
- Input: `{ domain: z.string().max(50), locale: z.string().max(10).default('en') }`
- Calls: `onboardingContentService.getAssessmentQuestions(input.domain, input.locale)`

#### G1.3: Wire assessment/page.tsx to API with fallback
- **File:** `apps/web/app/(onboarding)/assessment/page.tsx`
- Add `trpc.onboarding.assessmentQuestions.useQuery({ domain: assessDomain, locale })`
- Merge logic: if API returns questions, use them; otherwise fallback to `QUESTIONS` mock
- Adaptive logic (`getNextQuestion`, `shouldStopAssessment`, `computeLevel`) stays client-side — just source data changes
- NPC reaction data must include `correctEmotion`/`wrongEmotion` for compatibility

#### G1.4: Data Shape Alignment
```typescript
// Frontend expects (from _data/assessment-questions.ts):
interface AssessmentQuestion {
  id: string;
  domain: string;
  difficulty: 1 | 2 | 3;
  question: string;
  options: { id: string; text: string; correct: boolean }[];
  npcReaction: {
    correct: string;
    wrong: string;
    correctEmotion: NPCEmotion;
    wrongEmotion: NPCEmotion;
  };
}

// Backend must return same shape (translated)
```

---

### REQ-G2: Wire Archetypes to API + Add Inference

**Priority:** P2

#### G2.1: Wire character/page.tsx to `onboarding.archetypes` query
- **File:** `apps/web/app/(onboarding)/character/page.tsx`
- Add `trpc.onboarding.archetypes.useQuery({ locale })`
- Fallback to `ARCHETYPES` mock on error/empty
- Display archetype info below character preview (name, tagline, stats)

#### G2.2: Implement archetype inference in assessment/page.tsx
- **File:** `apps/web/app/(onboarding)/assessment/page.tsx`
- After assessment completes (lines 121, 144), call `setInferredArchetype(id)`
- Inference mapping:

| Intent | Path | Assessment Level | → Archetype |
|--------|------|:----------------:|:-----------:|
| `know` | direct | any | `strategist` |
| `explore_guided` | guided | beginner/familiar | `explorer` |
| `explore_guided` | guided | intermediate/advanced | `innovator` |
| `career` | career | any | `builder` |
| `exploring` | — | — | `explorer` (default, onboarding skipped) |
| fallback | any | any | `explorer` |

#### G2.3: Add archetype display + override on character page
- Show inferred archetype badge near character preview
- "Your learning style: {archetype.name}" with tagline
- Small "Change" link → opens archetype picker overlay (5 cards from API or mock)
- Override calls `setOverrideArchetype(id)` → used in `character.create` mutation

#### G2.4: Data Shape Alignment
```typescript
// Backend returns (from onboarding.archetypes):
interface ArchetypeOption {
  id: string;          // 'strategist' | 'explorer' | etc.
  name: string;        // translated
  tagline: string;     // translated
  bestFor: string;     // translated
  icon: string;
  color: string;
  stats: { label: string; value: number }[];
}

// Frontend ARCHETYPES mock has same shape — compatible
```

---

### REQ-G3: Wire Direct Path + Career Pains to submitGoal

**Priority:** P1

#### G3.1: Add submitGoal call to goal/direct/page.tsx
- **File:** `apps/web/app/(onboarding)/goal/direct/page.tsx`
- At pyramid phase "continue" handler (line 241), add:
  ```typescript
  submitGoalMutation.mutate({
    intent: 'know',
    path: 'direct',
    dreamGoal: dreamGoal || inputValue,
    milestones: performanceGoals.map(g => ({ id: g.id, text: g.text })),
    locale,
  }, { onError: (err) => console.warn('[submitGoal]', err.message) });
  ```
- Import `trpc` and add mutation hook

#### G3.2: Add careerPains to career path submitGoal
- **File:** `apps/web/app/(onboarding)/goal/career/page.tsx`
- Backend schema needs extension: add `pains: z.array(z.string().max(50)).max(5).optional()` to submitGoal input
- Backend service: add `pains` field to upsert
- Frontend: add `pains: careerPains` to mutation payload at line 271-278

#### G3.3: Backend schema extension
- **File:** `apps/api/src/trpc/trpc.router.ts` (submitGoal input)
- Add field: `pains: z.array(z.string().max(50)).max(5).optional()`
- **File:** `apps/api/src/onboarding/onboarding-content.service.ts` (submitGoal method)
- Add `pains: data.pains as any` to upsert create/update

---

## 4. Orphaned State Cleanup

### Store Fields Analysis

| Field | Set By | Read By | Persisted to DB? | Action |
|-------|--------|---------|:----------------:|--------|
| `intentSelectedAt` | `setIntent()` | **NOBODY** | ❌ | **REMOVE** — timestamp never read |
| `customInterests` | `addCustomInterest()` | **NOBODY** | ❌ | **FIX** — should merge into `selectedInterests` + send in submitGoal |
| `careerPains` | `toggleCareerPain()` | career page (display) | ❌ | **FIX** — add to submitGoal payload (GAP-3b) |
| `assessments` | `setAssessment()` | **NOBODY** | ✅ (via submitAssessment) | **KEEP** — stored for potential archetype inference |
| `inferredArchetypeId` | **NOBODY** | character page | ❌ | **FIX** — implement inference (GAP-2) |
| `overrideArchetypeId` | **NOBODY** | character page | ❌ | **FIX** — add UI for override (GAP-2) |
| `firstQuestStarted` | **NOBODY** | **NOBODY** | ❌ | **REMOVE** — first-quest is deprecated redirect |
| `firstQuestTasks` | **NOBODY** | **NOBODY** | ❌ | **REMOVE** — first-quest is deprecated redirect |
| `onboardingCompletedAt` | `completeOnboarding()` | **NOBODY** | ✅ (via user.completeOnboarding) | **KEEP** — useful for analytics |

### Cleanup Actions:
1. Remove `intentSelectedAt` from store + remove from `setIntent` action
2. Remove `firstQuestStarted`, `firstQuestTasks`, `setFirstQuestStarted`, `toggleFirstQuestTask`
3. Ensure `customInterests` are merged into `selectedInterests` array for submitGoal

---

## 5. Data Persistence Audit

### What Gets Persisted to Database

| Data | Endpoint | DB Table | Column | Status |
|------|----------|----------|--------|:------:|
| Intent + path | `submitGoal` | `onboarding_submissions` | `intent`, `path` | ⚠️ Direct path skipped |
| Dream goal | `submitGoal` | `onboarding_submissions` | `dreamGoal` | ⚠️ Direct path skipped |
| Domain | `submitGoal` | `onboarding_submissions` | `domain` | ✅ Guided path |
| Interests | `submitGoal` | `onboarding_submissions` | `interests` (JSON) | ✅ Guided path |
| Career target | `submitGoal` | `onboarding_submissions` | `careerTarget` | ✅ Career path |
| Career pains | — | — | — | 🔴 NOT PERSISTED |
| Milestones | `submitGoal` | `onboarding_submissions` | `milestones` (JSON) | ⚠️ Direct path skipped |
| Assessment | `submitAssessment` | `onboarding_submissions` | `assessments` (JSON) | ✅ All paths |
| Character | `character.create` | `characters` | `characterId`, `archetypeId` | ✅ All paths |
| Completion | `user.completeOnboarding` | `users` | `completedOnboardingAt` | ✅ All paths |

### What Stays in localStorage Only

| Data | Store Field | Risk |
|------|-------------|------|
| XP earned during onboarding | `xpTotal`, `level` | Low (cosmetic, not used post-onboarding) |
| Custom interests | `customInterests` | Medium (user-typed data lost on clear) |
| Career pains | `careerPains` | Medium (user selection lost) |
| Direct path goals | `dreamGoal`, `performanceGoals` | **HIGH** (primary onboarding data not synced) |

---

## 6. Implementation Phases

### Phase O1: Direct Path Sync + Career Pains (GAP-3) — P1

**Scope:** 3 files, ~30 lines changed

| # | File | Action |
|---|------|--------|
| 1 | `apps/api/src/trpc/trpc.router.ts` | Add `pains` field to `submitGoal` input schema |
| 2 | `apps/api/src/onboarding/onboarding-content.service.ts` | Add `pains` to submitGoal upsert |
| 3 | `apps/web/app/(onboarding)/goal/direct/page.tsx` | Add `trpc.onboarding.submitGoal.useMutation()` + call on continue |
| 4 | `apps/web/app/(onboarding)/goal/career/page.tsx` | Add `pains: careerPains` to submitGoal payload |

### Phase O2: Assessment Questions API (GAP-1) — P1

**Scope:** 3 files, ~60 lines changed

| # | File | Action |
|---|------|--------|
| 1 | `apps/api/src/onboarding/onboarding-content.service.ts` | Add `getAssessmentQuestions(domain, locale)` method |
| 2 | `apps/api/src/trpc/trpc.router.ts` | Add `assessmentQuestions` query procedure |
| 3 | `apps/web/app/(onboarding)/assessment/page.tsx` | Add API query with mock fallback |

### Phase O3: Archetypes Wire-Up + Inference (GAP-2) — P2

**Scope:** 2 files, ~80 lines changed

| # | File | Action |
|---|------|--------|
| 1 | `apps/web/app/(onboarding)/assessment/page.tsx` | Add archetype inference after assessment complete |
| 2 | `apps/web/app/(onboarding)/character/page.tsx` | Add archetypes API query, display badge, override UI |

### Phase O4: Store Cleanup — P2

**Scope:** 1 file, ~20 lines removed

| # | File | Action |
|---|------|--------|
| 1 | `packages/store/src/onboarding-v2.store.ts` | Remove `intentSelectedAt`, `firstQuestStarted`, `firstQuestTasks` + related actions |

---

## 7. Verification Checklist

### Phase O1
- [ ] Direct path: `dreamGoal` + `milestones` persisted in `onboarding_submissions` after completing pyramid step
- [ ] Career path: `pains` array present in `onboarding_submissions` after completing career path
- [ ] Backend accepts + stores new `pains` field without breaking existing submissions
- [ ] Guided + career paths still work correctly (regression)

### Phase O2
- [ ] Assessment page fetches questions from API when `ref_content` has assessment_question entries
- [ ] Falls back to `QUESTIONS` mock when API returns empty or errors
- [ ] NPC reactions work with API data (correctEmotion/wrongEmotion)
- [ ] Adaptive difficulty logic unchanged (client-side, source-agnostic)
- [ ] i18n: Questions render in current locale when translations available

### Phase O3
- [ ] Assessment completion sets `inferredArchetypeId` in store
- [ ] Character page shows inferred archetype badge
- [ ] "Change" link opens archetype picker with 5 options from API (fallback to mock)
- [ ] Override saves to store + sent in `character.create` mutation
- [ ] Default still works if inference and override are both null

### Phase O4
- [ ] `intentSelectedAt` removed — no TypeScript errors
- [ ] `firstQuestStarted`, `firstQuestTasks` removed — no TypeScript errors
- [ ] Existing localStorage data migration: old keys ignored gracefully (Zustand handles unknown keys)

### Cross-Phase
- [ ] `npm run build` — zero new TypeScript errors
- [ ] All 8 onboarding pages render correctly
- [ ] Full flow: intent → legend → goal → assessment → character → home works end-to-end
- [ ] LocalePicker locale change re-triggers API queries correctly

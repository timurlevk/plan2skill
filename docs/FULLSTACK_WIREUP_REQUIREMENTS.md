# Full-Stack Wire-Up Requirements — Plan2Skill Platform

> **Status:** IMPLEMENTED v1.0 — All 6 phases complete (W1-W6)
> **Date:** 2026-03-04
> **Implemented:** 2026-03-04
> **Based on:** Wire-Up Best Practices Research, Backend Audit (66 endpoints), Frontend Audit (59 calls)
> **Goal:** Zero orphaned endpoints, zero phantom consumers, full error handling

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Gap Analysis](#3-gap-analysis)
4. [Wire-Up Map](#4-wire-up-map)
5. [Implementation Phases](#5-implementation-phases)
6. [Error Handling Standard](#6-error-handling-standard)
7. [Orphaned State Cleanup](#7-orphaned-state-cleanup)
8. [Verification & Tooling](#8-verification--tooling)
9. [Agent Workflow Rules](#9-agent-workflow-rules)

---

## 1. Executive Summary

### Platform Inventory

| Layer | Count | Status |
|-------|:-----:|--------|
| Prisma models | 32 | All migrated |
| NestJS services | 26 | 19 domain + 7 infra |
| tRPC routers | 16 | All registered in appRouter |
| tRPC endpoints | 66 | All implemented in services |
| Frontend tRPC calls | 59 | Some endpoints called from multiple places |
| Zustand stores | 7 | auth, character, progression, roadmap, narrative, onboardingV2, i18n |

### Key Findings

| Finding | Count | Severity |
|---------|:-----:|:--------:|
| **Orphaned endpoints** (backend exists, no frontend consumer) | 14 | HIGH |
| **Missing error handling** (silent failures) | 10+ locations | HIGH |
| **Orphaned store fields** (declared, never populated or read) | 7 fields | MEDIUM |
| **Phantom consumers** (UI expects data that never arrives) | 3 features | MEDIUM |
| **Missing admin endpoints** (service methods without tRPC) | 3 methods | LOW |

---

## 2. Current State Audit

### 2.1 What's Working Well

- **Server hydration** — `useServerHydration.ts` runs 7 parallel queries with `hydratedRef` guard, staleTime 5min, retry 1. Solid pattern.
- **Narrative system** — Best wired module. 11 endpoints, all consumed, admin panel with invalidation.
- **Progression store** — Clean separation of local vs API state. `completeTask` is complex (XP, loot, streak, skill Elo) but properly wired.
- **Onboarding flow** — 6 endpoints, all consumed with locale-aware fallbacks.
- **tRPC type chain** — Zod schemas → router → client → store → component works end-to-end.

### 2.2 Architecture Diagram (Current)

```
packages/types/          → Shared Zod schemas, TypeScript types
packages/api-client/     → tRPC client (httpBatchLink, auth headers, token refresh)
packages/store/          → 7 Zustand stores (persisted to localStorage)

apps/api/
  src/trpc/trpc.router.ts  → appRouter aggregates 16 sub-routers
  src/[domain]/             → service.ts + module.ts per domain
  src/ai/generators/        → 4 AI generators (roadmap, quest, assessment, narrative)

apps/web/
  app/providers.tsx         → TrpcProvider wraps QueryClient
  app/(dashboard)/home/_hooks/useServerHydration.ts → 7 parallel hydration queries
  app/(dashboard)/          → Dashboard pages consume stores
  app/(onboarding)/         → Onboarding wizard pages
  app/(admin)/              → Admin panel pages
```

---

## 3. Gap Analysis

### 3.1 Orphaned Endpoints (Backend → ??? → No Frontend)

These 14 endpoints exist in the backend router but have **zero frontend consumers**:

| # | Endpoint | Router | Purpose | Consumer Needed |
|---|----------|--------|---------|-----------------|
| 1 | `user.updateDisplayName` | user | Change display name | Settings page / Hero Card |
| 2 | `user.updatePreferences` | user | quietMode, timezone, locale | Settings page |
| 3 | `quest.daily` | quest | Get today's quests | Home page quest list |
| 4 | `quest.generateDaily` | quest | Generate new daily quests | Home page (auto-trigger) |
| 5 | `quest.validate` | quest | Validate quest completion quality | Quest completion flow |
| 6 | `review.create` | review | Create new spaced repetition item | Post-quest skill tracking |
| 7 | `achievement.sync` | achievement | Batch sync achievement IDs | Hydration or background sync |
| 8 | `equipment.equipped` | equipment | Get currently equipped items | Hero Card equipment display |
| 9 | `loot.roll` | loot | Roll loot after quest completion | Quest reward flow |
| 10 | `assessment.generate` | assessment | AI-generate skill assessment | Assessment page |
| 11 | `assessment.submit` | assessment | Submit assessment answers | Assessment page |
| 12 | `skillElo.list` | skillElo | Get all skill Elo ratings | Skill mastery dashboard |
| 13 | `skillElo.get` | skillElo | Get single skill Elo | Skill detail view |
| 14 | `onboarding.archetypes` | onboarding | Get archetype definitions | Archetype selection step |

### 3.2 Missing Error Handling (Silent Failures)

These locations swallow errors, showing empty UI instead of actionable feedback:

| # | File | Call | Risk |
|---|------|------|------|
| 1 | `useServerHydration.ts` | 7 queries | App loads with empty state, no retry |
| 2 | `DailyEpisodeCard.tsx` | markRead, dismiss mutations | User thinks action succeeded |
| 3 | `InventoryDrawer.tsx` | equip, unequip mutations | UI shows equipped but server didn't |
| 4 | `useSpacedRepetition.ts` | mastery, due queries | Empty mastery ring, no "retry" |
| 5 | `admin/layout.tsx` | user.profile query | No redirect on failed auth check |
| 6 | `shop/page.tsx` | catalog query | Empty shop, user thinks no items |
| 7 | `forge/page.tsx` | forge mutation | Local state inconsistency |
| 8 | `ai-ops/page.tsx` | 5 admin queries | Empty dashboard, no loading/error |
| 9 | `roadmap/[id]/adjust/page.tsx` | roadmap.adjust | Needs verification |
| 10 | `useWeeklyChallenges.ts` | weeklyChallenges query | Falls back to empty array |

### 3.3 Orphaned Store State (Declared but Dead)

| # | Store | Field | Issue |
|---|-------|-------|-------|
| 1 | `characterStore` | `equipment: CharacterEquipment[]` | Populated but never read; `inventory[]` is used instead |
| 2 | `characterStore` | `companionId` | Populated from API but no UI renders companion |
| 3 | `onboardingV2Store` | `performanceGoals` | Saved locally, never sent to server |
| 4 | `onboardingV2Store` | `xp, level` | Accumulated during onboarding, orphaned on complete |
| 5 | `onboardingV2Store` | `selectedRole` | Declared, never set or read |
| 6 | `onboardingV2Store` | `defaultPath` | Declared, never read |
| 7 | `roadmapStore` | `forgeProgress, forgePhase` | Set during generation, no UI display |

### 3.4 Missing Backend Endpoints (Service Methods Without tRPC)

| # | Service | Method | Needed For |
|---|---------|--------|------------|
| 1 | `CharacterService` | `updateArchetype()` | Post-onboarding archetype change |
| 2 | `TranslationService` | `set()` | Admin translation management |
| 3 | `TranslationService` | `invalidate()` | Admin cache invalidation |

---

## 4. Wire-Up Map

### 4.1 Legend

```
✅ = Fully wired (endpoint → store → component, with error handling)
🔌 = Wired but missing error handling
🔴 = Orphaned endpoint (no frontend consumer)
⚡ = Needs new frontend page/component
```

### 4.2 Complete Endpoint → Store → Component Map

#### User Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `user.profile` | authStore (implicit) | admin/layout.tsx | 🔌 |
| `user.updateDisplayName` | — | — | 🔴 |
| `user.updatePreferences` | — | — | 🔴 |
| `user.completeOnboarding` | onboardingV2Store | character/page.tsx, intent/page.tsx | ✅ |

**Wire-up needed:** Settings page consuming `user.updateDisplayName` + `user.updatePreferences`

#### Character Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `character.get` | characterStore | useServerHydration | ✅ |
| `character.create` | onboardingV2Store | character/page.tsx | ✅ |

**Wire-up needed:** `character.updateArchetype` endpoint (new) + Settings page

#### Roadmap Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `roadmap.list` | roadmapStore | useServerHydration | ✅ |
| `roadmap.get` | (local) | roadmap/[id]/page.tsx | ✅ |
| `roadmap.generate` | roadmapStore | roadmap/new/page.tsx | ✅ |
| `roadmap.completionStats` | roadmapStore | useRoadmapCompletion | ✅ |
| `roadmap.trending` | roadmapStore | useRoadmapCompletion | ✅ |
| `roadmap.adjust` | roadmapStore | roadmap/[id]/adjust/page.tsx | 🔌 |
| `roadmap.pause` | roadmapStore | roadmap/page, [id]/page | ✅ |
| `roadmap.resume` | roadmapStore | roadmap/page, [id]/page | ✅ |
| `roadmap.checkLimit` | (local) | roadmap/new/page.tsx | ✅ |

#### Progression Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `progression.getProfile` | progressionStore | useServerHydration | ✅ |
| `progression.completeTask` | progressionStore | useQuestEngine | ✅ |
| `progression.rechargeEnergy` | progressionStore | home/page.tsx | ✅ |

#### Quest Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `quest.daily` | — | — | 🔴⚡ |
| `quest.generateDaily` | — | — | 🔴⚡ |
| `quest.validate` | — | — | 🔴⚡ |

**Wire-up needed:** Home page quest list, daily quest generation trigger, quest completion validation flow

#### Spaced Repetition Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `review.due` | (local) | useSpacedRepetition, useRoadmapCompletion | 🔌 |
| `review.submit` | (local) | useSpacedRepetition | 🔌 |
| `review.mastery` | progressionStore | useServerHydration, useSpacedRepetition | 🔌 |
| `review.create` | — | — | 🔴 |

**Wire-up needed:** Auto-create review items after quest completion

#### Achievement Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `achievement.list` | progressionStore | useServerHydration | ✅ |
| `achievement.unlock` | progressionStore | useQuestEngine | ✅ |
| `achievement.sync` | — | — | 🔴 |
| `achievement.weeklyChallenges` | (local) | useWeeklyChallenges | 🔌 |

**Wire-up needed:** Batch sync in hydration layer (replace individual unlocks)

#### Equipment Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `equipment.inventory` | characterStore | useServerHydration | ✅ |
| `equipment.equipped` | — | — | 🔴 |
| `equipment.equip` | characterStore | InventoryDrawer | 🔌 |
| `equipment.unequip` | characterStore | InventoryDrawer | 🔌 |
| `equipment.attributes` | characterStore | useServerHydration | ✅ |
| `equipment.forge` | characterStore | forge/page.tsx | ✅ |

**Wire-up needed:** `equipment.equipped` in Hero Card for visual equipment display

#### Loot Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `loot.roll` | — | — | 🔴⚡ |

**Wire-up needed:** Quest completion reward flow → loot roll → inventory update → reveal animation

#### Shop Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `shop.catalog` | (local) | shop/page.tsx | 🔌 |
| `shop.purchase` | progressionStore | shop/page.tsx | ✅ |

#### Narrative Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `narrative.todayEpisode` | narrativeStore | DailyEpisodeCard | 🔌 |
| `narrative.markRead` | narrativeStore | DailyEpisodeCard | 🔌 |
| `narrative.dismiss` | narrativeStore | DailyEpisodeCard | 🔌 |
| `narrative.preference` | narrativeStore | DailyEpisodeCard | ✅ |
| `narrative.setMode` | narrativeStore | chronicle/page.tsx | ✅ |
| `narrative.seasons` | (local) | chronicle/page.tsx | ✅ |
| `narrative.seasonEpisodes` | (local) | chronicle/page.tsx | ✅ |
| `narrative.completeLegend` | narrativeStore | legend/page.tsx | ✅ |
| `narrative.reviewQueue` | (local) | admin/narrative | ✅ |
| `narrative.review` | (local) | admin/narrative | ✅ |
| `narrative.generateBatch` | (local) | admin/narrative | ✅ |

#### Assessment Domain (Phase G)

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `assessment.generate` | — | — | 🔴⚡ |
| `assessment.submit` | — | — | 🔴⚡ |

**Wire-up needed:** Skill assessment page (adaptive difficulty via AI)

#### Skill Elo Domain (Phase J)

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `skillElo.list` | — | — | 🔴⚡ |
| `skillElo.get` | — | — | 🔴⚡ |

**Wire-up needed:** Skill mastery dashboard showing Elo ratings per domain

#### Admin Domain (Phase H)

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `admin.llmCosts` | (local) | ai-ops/page.tsx | 🔌 |
| `admin.llmUsage` | (local) | ai-ops/page.tsx | 🔌 |
| `admin.llmErrors` | (local) | ai-ops/page.tsx | 🔌 |
| `admin.llmCacheStats` | (local) | ai-ops/page.tsx | 🔌 |
| `admin.llmTopUsers` | (local) | ai-ops/page.tsx | 🔌 |

#### i18n Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `i18n.messages` | i18nStore | useLoadTranslations | ✅ |

#### Onboarding Domain

| Endpoint | Store | Component | Status |
|----------|-------|-----------|:------:|
| `onboarding.intents` | (local) | intent/page.tsx | ✅ |
| `onboarding.domains` | (local) | goal/guided/page.tsx | ✅ |
| `onboarding.careerData` | (local) | goal/career/page.tsx | ✅ |
| `onboarding.archetypes` | — | — | 🔴 |
| `onboarding.submitAssessment` | onboardingV2Store | assessment/page.tsx | ✅ |
| `onboarding.submitGoal` | onboardingV2Store | goal/career, goal/guided | ✅ |

**Wire-up needed:** `onboarding.archetypes` in archetype selection (currently uses local ARCHETYPES data)

### 4.3 Summary Counts

| Status | Count | Percentage |
|--------|:-----:|:----------:|
| ✅ Fully wired | 37 | 56% |
| 🔌 Wired, missing error handling | 15 | 23% |
| 🔴 Orphaned (no frontend) | 14 | 21% |
| **Total endpoints** | **66** | 100% |

---

## 5. Implementation Phases

### Phase W1: Quest Engine Wire-Up (Priority: CRITICAL)

**Why first:** Quests are the core gameplay loop. Without `quest.daily`, `quest.generateDaily`, `quest.validate`, and `loot.roll`, the home page cannot show real quests.

| Layer | File | Change |
|-------|------|--------|
| Store | `packages/store/src/quest.store.ts` | **NEW** — dailyQuests[], isGenerating, lastGeneratedDate |
| Hook | `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts` | **NEW** — orchestrates daily→generate→validate→loot→complete |
| Hydration | `useServerHydration.ts` | ADD `trpc.quest.daily.useQuery()` → questStore |
| Component | Home page quest list | MODIFY — read from questStore instead of mock data |
| Component | Quest completion modal | MODIFY — call `quest.validate` before `progression.completeTask` |
| Component | Loot reveal | MODIFY — call `loot.roll` after task completion, show reward |
| Component | Review creation | ADD — call `review.create` after quest for skill tracking |

**Connection chain:**
```
Home loads → quest.daily → questStore.dailyQuests → QuestCard renders
User taps "Complete" → quest.validate → progression.completeTask → loot.roll → review.create
                     → lootStore update → EquipmentReveal animation
                     → characterStore.inventory refresh
```

**Wire-Up Map:**
```
quest.daily          → questStore.dailyQuests      → home/QuestList
quest.generateDaily  → questStore (auto-trigger)   → home/QuestList (refetch)
quest.validate       → (inline result)             → QuestCompletionModal
loot.roll            → characterStore.inventory    → EquipmentReveal
review.create        → (fire-and-forget)           → (no UI, background)
```

### Phase W2: Assessment & Skill Elo Wire-Up (Priority: HIGH)

**Why second:** Adaptive difficulty (Phase G+J) endpoints are fully built but have zero frontend.

| Layer | File | Change |
|-------|------|--------|
| Store | `packages/store/src/skill.store.ts` | **NEW** — skillElos[], currentAssessment |
| Page | `apps/web/app/(dashboard)/assessment/page.tsx` | **NEW** — AI assessment flow |
| Page | `apps/web/app/(dashboard)/skills/page.tsx` | **NEW** — Skill mastery dashboard with Elo |
| Hydration | `useServerHydration.ts` | ADD `trpc.skillElo.list.useQuery()` → skillStore |

**Wire-Up Map:**
```
assessment.generate  → skillStore.currentAssessment → assessment/page.tsx
assessment.submit    → skillStore.skillElos         → skills/page.tsx (update)
skillElo.list        → skillStore.skillElos         → skills/page.tsx, hero-card
skillElo.get         → (inline)                     → skill detail modal
```

### Phase W3: Settings & User Preferences (Priority: HIGH)

**Why third:** `user.updateDisplayName` and `user.updatePreferences` are trivial to wire but affect UX.

| Layer | File | Change |
|-------|------|--------|
| Page | `apps/web/app/(dashboard)/settings/page.tsx` | **NEW** — Settings page |
| Store | `authStore` or `userStore` | MODIFY — add displayName, preferences |
| Component | Hero Card | MODIFY — editable display name |

**Wire-Up Map:**
```
user.updateDisplayName   → authStore.displayName   → settings/page, hero-card
user.updatePreferences   → progressionStore        → settings/page (quietMode, tz, locale)
onboarding.archetypes    → (local/cache)           → archetype selector in settings
character.updateArchetype → characterStore          → settings/page (new endpoint needed)
```

### Phase W4: Equipment Visual Wire-Up (Priority: MEDIUM)

**Why fourth:** `equipment.equipped` exists but Hero Card uses NeonIcon placeholders.

| Layer | File | Change |
|-------|------|--------|
| Hydration | `useServerHydration.ts` | ADD `trpc.equipment.equipped.useQuery()` |
| Component | `hero-card/page.tsx` | MODIFY — render pixel art from equipped items |
| Component | `InventoryDrawer.tsx` | MODIFY — add error handling for equip/unequip |

**Wire-Up Map:**
```
equipment.equipped  → characterStore.equippedItems → hero-card (visual equipment)
equipment.equip     → characterStore + invalidate  → InventoryDrawer (with error toast)
equipment.unequip   → characterStore + invalidate  → InventoryDrawer (with error toast)
```

### Phase W5: Error Handling Retrofit (Priority: HIGH — cross-cutting)

Add proper error handling to all 15 🔌 locations. This runs in parallel with W1-W4.

**Standard pattern (see Section 6):**
```typescript
const { data, isLoading, error } = trpc.X.useQuery();

// Loading state
if (isLoading) return <Skeleton />;

// Error state
if (error) return <ErrorBanner message={error.message} onRetry={refetch} />;

// Empty state
if (!data?.length) return <EmptyState />;

// Data state
return <DataDisplay data={data} />;
```

**Files to retrofit:**

| # | File | Queries/Mutations | Fix |
|---|------|-------------------|-----|
| 1 | `useServerHydration.ts` | 7 queries | Add global error boundary + retry |
| 2 | `DailyEpisodeCard.tsx` | markRead, dismiss | Add onError toast |
| 3 | `InventoryDrawer.tsx` | equip, unequip | Add onError toast + rollback |
| 4 | `useSpacedRepetition.ts` | mastery, due | Add error return to hook |
| 5 | `admin/layout.tsx` | user.profile | Add error → redirect to login |
| 6 | `shop/page.tsx` | catalog query | Add loading skeleton + error |
| 7 | `forge/page.tsx` | forge mutation | Add onError rollback |
| 8 | `ai-ops/page.tsx` | 5 admin queries | Add loading/error states |
| 9 | `useWeeklyChallenges.ts` | weeklyChallenges | Add error return |
| 10 | `useRoadmapCompletion.ts` | stats, trending | Add error states |

### Phase W6: Achievement Sync + Cleanup (Priority: LOW)

| Layer | File | Change |
|-------|------|--------|
| Hydration | `useServerHydration.ts` | Replace individual achievement.list with achievement.sync |
| Store | `characterStore` | REMOVE orphaned `equipment` field (use `inventory` only) |
| Store | `onboardingV2Store` | REMOVE `selectedRole`, `defaultPath` (dead fields) |
| Store | `roadmapStore` | REMOVE or WIRE `forgeProgress`, `forgePhase` |

---

## 6. Error Handling Standard

### 6.1 Query Error Pattern

```typescript
// GOOD — Every query must handle 4 states
function QuestList() {
  const { data, isLoading, error, refetch } = trpc.quest.daily.useQuery();

  if (isLoading) return <QuestListSkeleton />;
  if (error) return <ErrorBanner message="Failed to load quests" onRetry={refetch} />;
  if (!data?.quests?.length) return <EmptyState message="No quests today" />;
  return <QuestGrid quests={data.quests} />;
}
```

### 6.2 Mutation Error Pattern

```typescript
// GOOD — Every mutation must handle success + error
const equipMutation = trpc.equipment.equip.useMutation({
  onMutate: ({ slot, itemId }) => {
    // Optimistic update
    const prev = characterStore.getState().inventory;
    characterStore.getState().equipItem(slot, itemId);
    return { prev };
  },
  onError: (err, vars, ctx) => {
    // Rollback
    if (ctx?.prev) characterStore.getState().setInventory(ctx.prev);
    toast.error(`Failed to equip: ${err.message}`);
  },
  onSuccess: () => {
    // Invalidate related queries
    utils.equipment.inventory.invalidate();
    utils.equipment.attributes.invalidate();
  },
});
```

### 6.3 Hydration Error Pattern

```typescript
// GOOD — Hydration failures must be visible
const profileQuery = trpc.progression.getProfile.useQuery(undefined, {
  enabled: isAuthenticated && !hydratedRef.current,
  retry: 2,
  onError: (err) => {
    console.error('[hydration] progression.getProfile failed:', err.message);
    // Don't block app — user sees stale localStorage data
    // But show a non-blocking banner
    setHydrationError(true);
  },
});
```

---

## 7. Orphaned State Cleanup

### 7.1 Fields to Remove

| Store | Field | Reason | Action |
|-------|-------|--------|--------|
| `characterStore` | `equipment: CharacterEquipment[]` | `inventory[]` is the canonical source | DELETE field + setter + any reads |
| `onboardingV2Store` | `selectedRole` | Never set or read | DELETE |
| `onboardingV2Store` | `defaultPath` | Never read | DELETE |

### 7.2 Fields to Wire (Not Remove)

| Store | Field | Current State | Action |
|-------|-------|---------------|--------|
| `characterStore` | `companionId` | Populated but no UI | Phase 4 (Character Redesign) will add companion rendering |
| `onboardingV2Store` | `performanceGoals` | Saved locally only | Wire to `onboarding.submitGoal` payload |
| `onboardingV2Store` | `xp, level` | Accumulated, orphaned | Wire to `progression` on `completeOnboarding` |
| `roadmapStore` | `forgeProgress, forgePhase` | Set but not displayed | Add progress indicator to roadmap/new generation UI |

---

## 8. Verification & Tooling

### 8.1 Manual Verification Checklist (Per Phase)

```markdown
## Wire-Up Verification — Phase W[N]

### Backend
- [ ] Every new service method has a tRPC procedure
- [ ] Zod input schemas validate correctly
- [ ] `npx prisma generate` — no errors

### Frontend
- [ ] Every endpoint has >= 1 `trpc.X.useQuery/useMutation` consumer
- [ ] Every store field has a real data source (not hardcoded)
- [ ] Loading state shows skeleton/spinner
- [ ] Error state shows message + retry button
- [ ] Empty state shows appropriate UI
- [ ] No `any` types in store or component props

### Cross-Cutting
- [ ] `npm run typecheck` — zero new errors
- [ ] `npm run build` — succeeds
- [ ] Optimistic updates revert on error
- [ ] Auth guards present on protected endpoints
- [ ] list modified files grouped by layer:
  Schema:   [files]
  Service:  [files]
  Router:   [files]
  Store:    [files]
  Component:[files]
```

### 8.2 Automated Verification (Future)

Create `scripts/verify-wireup.ts` using ts-morph (from research):
- Scan all tRPC router files → extract procedure names
- Scan all frontend files → extract `trpc.X.useQuery/useMutation` calls
- Cross-reference → report orphaned + phantom
- Run in CI as part of `npm run lint`

### 8.3 Claude Code Hooks (Recommended)

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "cd /c/Users/Admin/Downloads/Roadmapper/plan2skill && npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep 'error TS' | grep -v 'league/page\\|QuizCardV2\\|assessment/page\\|progression.store' | head -5"
      }
    ]
  }
}
```

---

## 9. Agent Workflow Rules

### 9.1 Vertical Slice Rule (MANDATORY)

When wiring a new feature, complete ALL 5 layers before moving to the next feature:

```
1. Schema  → packages/types/ (Zod schema + z.infer type)
2. Service → apps/api/src/[domain]/[domain].service.ts
3. Router  → apps/api/src/trpc/trpc.router.ts (procedure)
4. Store   → packages/store/src/[domain].store.ts (state + actions)
5. UI      → apps/web/app/(...)/page.tsx (trpc hook + useEffect sync)
```

**NEVER create a backend endpoint without its frontend consumer.**
**NEVER create a store field without a real data source.**

### 9.2 Pattern Reference (Copy These)

| Pattern | Reference File | Key Lines |
|---------|----------------|-----------|
| Server hydration | `useServerHydration.ts` | 7 parallel queries, hydratedRef guard |
| Auth guard | `admin/layout.tsx` | trpc.user.profile + redirect |
| Optimistic mutation | `chronicle/page.tsx` | setMode with onError rollback |
| Store sync | `DailyEpisodeCard.tsx` | useEffect syncs trpc data → narrativeStore |
| Admin invalidation | `admin/narrative/page.tsx` | useUtils().X.invalidate() on mutation success |

### 9.3 No Orphan Code Rule

After completing wire-up, run this mental checklist:
1. Every new `t.procedure.query/mutation` → has a `trpc.X.useQuery/useMutation` call
2. Every new store field → has a `useEffect` or `onSuccess` that populates it
3. Every new UI component → reads from store, not hardcoded data
4. Every mutation → has `onError` handler (at minimum console.warn + toast)
5. Every query → handles `isLoading`, `error`, and empty states

### 9.4 Commit Cadence

Commit after each phase completion:
```
git add [specific files]
git commit -m "feat(wireup): Phase W[N] — [Quest Engine / Assessment / Settings / Equipment / Error Handling / Cleanup]"
```

---

## Appendix A: Dependency Graph

```
Phase W1 (Quest Engine)  ─────────── CRITICAL PATH
    ↓
Phase W2 (Assessment + Skill Elo)
    ↓
Phase W3 (Settings + Preferences)

Phase W4 (Equipment Visual)  ─────── Can start after W1
Phase W5 (Error Handling)    ─────── Runs in PARALLEL with W1-W4
Phase W6 (Cleanup)           ─────── After W1-W5 complete
```

### Estimated Effort

| Phase | Endpoints Wired | New Files | Modified Files | Est. |
|-------|:---------------:|:---------:|:--------------:|:----:|
| W1: Quest Engine | 5 | 2 | 4 | 1-2d |
| W2: Assessment + Elo | 4 | 3 | 1 | 1d |
| W3: Settings | 3 | 1 | 2 | 0.5d |
| W4: Equipment Visual | 1 | 0 | 3 | 0.5d |
| W5: Error Handling | 0 | 0 | 10 | 1d |
| W6: Cleanup | 1 | 0 | 4 | 0.5d |
| **Total** | **14** | **6** | **24** | **~5d** |

---

## Appendix B: Scorecard After Full Wire-Up

| Metric | Before | After |
|--------|:------:|:-----:|
| Orphaned endpoints | 14 | 0 |
| Error handling gaps | 15 | 0 |
| Orphaned store fields | 7 | 0 |
| Endpoint coverage | 79% (52/66) | 100% (66/66) |
| ✅ Fully wired | 56% | 100% |

---

*End of requirements document.*

# Dashboard Redesign Requirements

> Quest dashboard home screen redesign based on EdTech UX research.
> Platforms studied: Duolingo, Khan Academy, Brilliant.org, Codecademy, Coursera, LinkedIn Learning, Habitica, Sololearn, Roadmap.sh, Headway, freeCodeCamp, Todoist.
> **Prototype:** `docs/dashboard-redesign-prototype.html`

## Problems (Current State)

### P1: Completed quests disappear entirely
`quest.service.ts:getDailyQuests()` filters `status: { in: ['available', 'locked'] }` — completed tasks are excluded from the API response. Users lose visibility of their progress and cannot review learned material.

### P2: No review mechanism
After completing a quest, users have no way to revisit content, check what they learned, or refresh their memory. The spaced repetition system (`useSpacedRepetition`) exists but has no dedicated UI.

### P3: Quest Lines widget doesn't update reactively
`ActiveQuests` reads from `useRoadmapStore` which only hydrates once on page load. Fixed in this session (roadmap refetch after quest completion + SSE generation), but the widget's role in the page hierarchy needs rethinking.

### P4: No multi-roadmap support in daily quests UI
Paid users can have up to 7 parallel roadmaps, but `getDailyQuests` aggregates all quests into a flat list. Users can't tell which roadmap a quest belongs to or filter by roadmap.

### P5: No clear "what to do next" signal
The dashboard shows all quests equally. There's no single prominent CTA that answers "what should I do right now?" — causing decision paralysis (Hick's Law).

### P6: No progress clarity across roadmaps
Users lack a clear picture of where they are across all their learning journeys. Individual quest completion doesn't visually connect to milestone/roadmap progress.

---

## Design Principles (Research-Backed)

| Principle | Source | Application |
|-----------|--------|-------------|
| **One CTA** | Coursera "Next Step", Codecademy "Today View" | Single "Continue Quest" hero banner at top |
| **Progressive Disclosure** | All platforms | Dashboard → Roadmap → Quest (3 levels of detail) |
| **Miller's Law** | Cognitive science (7±2, practical ~4) | Max 7 roadmap cards; max 5 daily quests visible |
| **Completed = Visible** | Duolingo (golden nodes on path) | Completed quests stay in list with completed styling |
| **Unified Progression** | Khan Academy, Duolingo, Habitica | XP/level aggregate across all roadmaps |
| **Variable Rewards** | Duolingo chests, Habitica random drops | Already implemented (loot drops, bonus XP) |
| **Celebration Moments** | Duolingo (-60% perceived wait time) | Already implemented (level-up, streak milestones) |

---

## Icon System

All icons use the **NeonIcon** component (`NeonIcon.tsx`) — 57 inline SVG icons with 24×24 viewBox.

**Key icon mappings:**
- Continue Quest CTA label: `compass` (navigation metaphor)
- CTA button: `swords` (action)
- Quest task types: `book` (article), `play` (video), `quiz` (quiz), `rocket` (project), `crown` (boss)
- Section headers: `sparkle` (daily quests), `map` (roadmaps), `scroll` (quest lines)
- Milestone nodes: `medal` (regular milestones), `trophy` (final milestone only)
- Roadmap cards: use domain-appropriate icons (`code`, `globe`, `terminal`, `atom`, etc.)

No Unicode emoji — all visual icons sourced from `NeonIcon.tsx`.

---

## Roadmap Tier System

Roadmap chips use a **tier-based color system** ranked by user activity/engagement (not by domain). Each chip has a **3D embossed** visual style.

### Tier Colors

| Tier | Background Gradient | Text | Meaning |
|------|-------------------|------|---------|
| **Diamond** | `#D0F8FF` → `#8ED8EC` | `#0A3040` | Primary/main roadmap — most recently accessed, highest engagement |
| **Gold** | `#FFE566` → `#D4A800` | `#3D2800` | Active secondary — regular progress |
| **Silver** | `#D8D8D8` → `#A0A0A0` | `#1A1A1A` | Less active tertiary — occasional progress |
| **Bronze** | `#D99548` → `#A06828` | `#2A1500` | No recent progress |

### 3D Embossed Chip Style (Prototype: `.tag-diamond`, `.tag-gold`, etc.)

- **Vertical gradient**: lighter top → darker bottom (classic 3D pill)
- **Inset top highlight**: `inset 0 1px 0 rgba(255,255,255,0.3–0.6)` (light reflection)
- **Inset bottom shadow**: `inset 0 -1px 0 rgba(0,0,0,0.15–0.25)` (depth rim)
- **Text shadow**: `0 1px 0 rgba(255,255,255,0.15–0.35)` (micro-highlight)
- **External shadow**: `0 1px 3px rgba(0,0,0,0.4)` (floating above surface)

### Tier Assignment Algorithm (BE-2)

Recalculated on each `getDailyQuests` call:
1. **Diamond** — roadmap with most recent `lastAccessedAt` + active progress
2. **Gold** — roadmaps with progress in last 7 days
3. **Silver** — roadmaps with progress in last 30 days
4. **Bronze** — roadmaps with no recent progress

---

## Information Hierarchy (Top to Bottom)

> **Note:** Hero Status Bar (Avatar, Level, XP, Streak, Crystals) already exists in the left sidebar on desktop and top bar on mobile. No duplication on the dashboard page.

### Zone 1: "Continue Quest" Hero CTA (NEW)
**Priority**: P0 — most impactful single change

Single prominent card showing the highest-priority quest across all roadmaps.

**Visual icon:** `NeonIcon type="compass"` next to "Наступний квест" label — provides clear visual anchor.

**Content:**
- Quest title + description snippet
- Source roadmap badge (tier chip: diamond/gold/silver/bronze)
- Quest type icon (`NeonIcon` matching task type) + rarity badge + estimated time
- Progress indicator (if quest was partially completed)
- Single large "Continue Quest" / "Begin Quest" button (with `swords` icon)

**Priority algorithm (simple):**
1. Most recently accessed roadmap's next available quest
2. Fallback: roadmap with highest completion % (closest to milestone)
3. Fallback: first roadmap's first available quest

**Behavior:**
- Clicking opens `QuestJourneyModal` directly (skip quest list)
- If all daily quests are completed: show "All quests completed!" celebration card
- If no quests available: show roadmap generation status or "Quest Board" empty state

**Scene Effects (Prototype: `.continue-hero`):**
- **Ambient glow**: slow breathing box-shadow (6s `ctaAmbient`, 30px→120px spread), border opacity pulses from 0.15→0.35
- **Particle field**: two layers of scattered stars (~20 points each), slow float (9s/13s), opacity breathing 0.2↔1.0
- **Mystical fog**: 3 radial-gradient layers (violet/cyan/gold), slow drift (16s `mistDrift`)
- **Light beam**: slow sweeping highlight across card (12s `shimmerSweep`), purple-cyan tinted
- **Button**: breathing glow (4s `btnGlow`), no shimmer overlay
- Effects are **slow, mysterious, dramatic** — not flashy or hyperactive

**All-Done Celebration (Prototype: `.all-done-hero`):**
- Radial gradient background (cyan-tinted)
- Breathing cyan glow (3s `doneGlow`)
- Shimmer sweep (6s)
- Bouncing emoji (2s `celebrateBounce`)

### Zone 2: Roadmap Cards (NEW — replaces current ActiveQuests position)
**Priority**: P1

Horizontal scrollable row of roadmap summary cards (1-7 cards).

**Each card shows:**
- Roadmap title (truncated)
- Skill level badge (beginner/familiar/intermediate/advanced)
- Overall progress % with progress bar
- Current milestone name (only the active one — progressive disclosure)
- Quest count: "3/20 quests"

**Interaction:**
- Click → navigates to `/roadmap/{id}` (existing detail page)
- Horizontal scroll on mobile, grid wrap on desktop (3 per row max)
- "Manage..." link opens roadmap management (for paid tier: add/pause/resume)

**Sorting:** By last accessed (recency-first, Netflix pattern)

**Card Effects (Prototype: `.roadmap-card`):**
- **Active card**: breathing violet glow (3s `cardBreath`, box-shadow 14px→44px)
- **Progress bar fill**: shimmer sweep (2.5s `barShimmer`)

### Zone 3: Today's Quests (REDESIGNED)
**Priority**: P0

The main quest list, redesigned to show completed quests and support multi-roadmap tagging.

#### 3A: Active Quests Section
Quests with status `available` from all active roadmaps.

**Changes from current:**
- Add **roadmap source tag** on each quest card — **tag appears first** in the tag row (before rarity/type)
- Tags use the **tier-based 3D embossed chip style** (see "Roadmap Tier System" section above)
- Add **filter row** at top: per-roadmap filters first (sorted by recency), then "All" last (Habitica tag pattern)
- Keep existing: rarity badge, time estimate, XP reward, checkbox, quest modal on click

#### 3B: Completed Quests Section (NEW)
Collapsible section below active quests: **"Completed (N)"**

**Shows:**
- Today's completed quests with completed styling (checkmark, strikethrough, opacity 0.7)
- Click to re-open quest modal in review mode (read content, no XP reward)
- Collapsed by default, expandable with one click (LinkedIn Learning "History" pattern)

**Backend change required:**
- `getDailyQuests()` must also return completed tasks from today (separate array or flag)
- Or: new endpoint `quest.completedToday` returning today's completed tasks

#### 3C: Quest Count Header
Shows: "Today's Quests — Start your journey, hero! — 2/7"
- Motivational message changes based on progress (existing `getDailyProgressMessage`)
- Count reflects total across all roadmaps

### Zone 4: Quest Lines / Roadmap Progress (EXISTING, moved down)
The existing `ActiveQuests` component showing milestone timeline visualization.
Moved below daily quests (daily quests = primary action, roadmap = context).

Already fixed: reactive updates after quest completion and roadmap generation.

#### Milestone Visualization (Prototype: `.milestone-path`)

Each quest line card shows a horizontal milestone path with medal/trophy nodes connected by a glowing progress track.

**Milestone Node Types:**
- **Medal** (`medal` SVG, 22×22 in 44px dot) — all regular milestones
- **Trophy** (`trophy` SVG, 28×28 in 54px dot) — **only the final milestone** (larger, grander)

**Milestone States:**

| State | Background | Border | Effects | SVG |
|-------|-----------|--------|---------|-----|
| **Completed** | Opaque golden radial gradient (`#3D3118`→`#252015`) | 2.5px solid gold 70% | Breathing golden aura (3s `completedGlow`), inset glow, golden drop-shadow on SVG | Medal with checkmark |
| **Active** | Opaque purple radial gradient (`#2E2548`→`#1A1820`) | 2.5px solid violet | Triple glow (20+40+60px), breathing scale 1→1.06 (2.5s `activeBreath`), two pulsing outer rings (`activeRingPulse`), SVG drop-shadow | Medal with star detail |
| **Locked** | Solid dark (`#15151C`) | 1.5px dashed purple 25% | **Teasing pulse** (4s `lockedTease`): glow 6→18px, border 0.2→0.45 opacity, SVG visible at 0.55 + purple drop-shadow | Plain medal silhouette |
| **Trophy Locked** | Solid dark (`#15151C`) | 2px dashed gold 25% | **Golden teasing pulse** (4s `lockedTrophyTease`): glow 8→22px, border 0.2→0.45 | Trophy silhouette |
| **Trophy Active** | Opaque golden gradient (`#3D3118`→`#1A1815`) | Gold solid | Grand breathing glow (2.5s `trophyBreath`, 24→100px spread), golden pulsing rings | Trophy with detail |
| **Trophy Completed** | Golden gradient | Gold solid | Shine animation (3s `trophyShine`, brightness 1→1.2) | Trophy with checkmark |

**Locked Milestones — "Teasing" Design Philosophy:**
Locked milestones must **beckon the user forward**, not fade into invisibility. They should create desire ("I want to reach that!") through:
- Visible medal/trophy silhouettes (opacity 0.55, not 0.35)
- Pulsing glow that draws the eye
- Milestone names visible (opacity 0.7)
- Purple/gold tinted borders (not neutral grey)

**All milestone dot backgrounds are fully opaque** — the progress track line passes behind (z-index: 0/1) the dots (z-index: 2), creating a clean "dots on top of line" visual.

#### Progress Track (Prototype: `.milestone-track`, `.milestone-track-fill`)

| Property | Value |
|----------|-------|
| Background track | 4px, `rgba(37,37,48,0.8)`, z-index: 0 |
| Fill track | 6px, gradient violet→cyan, z-index: 1 |
| Fill glow | `box-shadow: 0 0 12px violet, 0 0 24px cyan` |
| Shimmer | Sweeping highlight (3s `trackShimmer`) |

**Progress Line Logic — "flows into" the active milestone:**
- The fill `scaleX` value must make the line **reach to the center of the active milestone dot**
- The opaque dot background covers the overlap, creating a seamless "line feeds into dot" effect
- The line must **never extend past** the active milestone toward the next locked one
- Example: 4 nodes, 1st active → `scaleX ≈ 0.12` (reaches node 1 center)
- Example: 5 nodes, 3rd active → `scaleX ≈ 0.52` (reaches node 3 center)
- Calculation: `scaleX = (activeNodeCenter - trackLeftOffset) / trackWidth`

**Quest Line Card Effects (Prototype: `.quest-line-card`):**
- Floating sparkle particles (4 multi-color points with box-shadow, 4s `sparkleFloat`)
- Subtle ambient animation creating depth

### Zone 5: Review & Mastery (NEW — future phase)
**Priority**: P2 (not in initial release)

A "Training Grounds" section for reviewing learned material:
- Spaced repetition cards from completed quest topics
- Weakness-targeted practice (topics where user made errors)
- Mastery level indicators with decay (Khan Academy pattern)
- "Knowledge Codex" — all learned concepts organized by topic

---

## Backend Changes

### BE-1: Return completed quests from getDailyQuests

**File:** `apps/api/src/quest/quest.service.ts`
**tRPC:** `apps/api/src/trpc/trpc.router.ts:231-233` — `quest.daily` procedure

**Current code (line 51):** Prisma query filters `status: { in: ['available', 'locked'] }` — excludes completed.
**Already available (lines 74-81):** `todayCompletions` query fetches `QuestCompletion` records for today + builds `completedTaskIds` set (line 82). Data exists but is only used for diversity filtering, never returned.

**Changes:**
1. Add second query: fetch `Task` rows by `id: { in: [...completedTaskIds] }` to get full task data for completed quests
2. Change return type: `Array<{...}>` → `{ available: Array<{...}>; completedToday: Array<{...}> }`
3. tRPC router auto-infers new type — no manual router change needed

**Edge case:** Completed tasks from paused/archived roadmaps — query by `QuestCompletion.taskId`, not by milestone status.

**Option A (recommended):** Return two arrays (as above)
**Option B:** Add a `status` field to each returned quest and let frontend filter.

### BE-2: Add roadmap source + tier to quest response

**File:** `apps/api/src/quest/quest.service.ts`

**Current code (lines 59-62):** `candidateTasks` flattened via `roadmaps.flatMap(r => r.milestones.flatMap(m => m.tasks))` — **roadmap context lost here**. Roadmap data is available at the `roadmaps` variable level (lines 42-57) but discarded during flattening.

**Changes:**
1. Preserve roadmap context during flattening — use `{ task, roadmapId, roadmapTitle }` tuples instead of bare `flatMap`
2. Add tier assignment as private helper: `private assignTiers(roadmaps): Map<string, RoadmapTier>`
3. Return `roadmapId`, `roadmapTitle`, `roadmapTier` per quest (lines 119-133 response mapping)

**Schema prerequisite:** `Roadmap` model (`prisma/schema.prisma:193-220`) has **no `lastAccessedAt` field**.
- **Option A (recommended):** Add `lastAccessedAt DateTime?` to Roadmap — requires `prisma migrate dev --name add-roadmap-last-accessed`. Update on quest completion in `ProgressionService.completeTask()` and on roadmap page visit.
- **Option B (no migration):** Derive from most recent `QuestCompletion.completedAt` per roadmap. More complex query.
- **Option C (rough proxy):** Use existing `@updatedAt` on Roadmap. Updated by any mutation, not just user activity.

**Type:** Add `RoadmapTier = 'diamond' | 'gold' | 'silver' | 'bronze'` to `packages/types/src/roadmap.ts`

### BE-3: Quest priority scoring (optional, P2)

**File:** `apps/api/src/quest/quest.service.ts`

**Data available:**
- Recency: `Roadmap.updatedAt` or `lastAccessedAt` (if added)
- Milestone proximity: `Milestone.progress` field exists (schema line 231)
- Difficulty vs Elo: `Task.difficultyTier` (1-5) + `SkillElo.elo` per domain

New private method in `quest.service.ts`, called after candidate selection. Deferred to Phase 2.

---

## Frontend Changes

### FE-1: "Continue Quest" Hero CTA component

**New file:** `apps/web/app/(dashboard)/home/_components/ContinueQuestHero.tsx`

**Codebase mapping:**
- **Insert into:** `apps/web/app/(dashboard)/home/page.tsx` between StatsRow (line 525) and DailyQuests (line 695)
- **Data sources:** `questGroups` (page.tsx:349), `engine.completedQuests` (from `useQuestEngine`), `roadmaps` (page.tsx:323 from `useRoadmapStore`), `setOpenQuestId` (page.tsx:390)
- **Priority algorithm:** existing `warmupQuest` logic (page.tsx:367-381) picks first uncompleted common quest — replace with new recency-based algorithm

**Conflict:** `WelcomeBack` component (page.tsx:483) already provides "warm-up quest" CTA. Options:
- Replace `WelcomeBack` entirely with `ContinueQuestHero`
- Keep `WelcomeBack` for returning users (`daysAbsent > 0`, line 356) and use hero CTA for daily use

**CSS keyframes:** Need injection strategy. Existing animations (`fadeUp`, `pulse`, `shimmer`, `shineSweep`, `confettiFall`, `bounceIn`) are already in the codebase — find injection point and follow same pattern.

### FE-2: Roadmap Cards row

**Split:** `apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx` (395 lines) → two files:
- **New:** `RoadmapCards.tsx` — Zone 2 horizontal card row (condensed: title, skill level, progress bar, milestone name, quest count)
- **New:** `QuestLines.tsx` — Zone 4 milestone timeline (extracted from ActiveQuests.tsx lines 226-339)

**Data source:** `useRoadmapStore` from `@plan2skill/store` — `roadmaps` array. Already reactive (fixed in prior session).
**Mock fallback:** ActiveQuests.tsx lines 20-71 has mock roadmap builder — preserve or move to shared location.
**Sorting:** Current `roadmap.service.ts:42` orders by `createdAt: 'desc'` — needs `lastAccessedAt` sort (or frontend sort).

### FE-3: Daily Quests with multi-roadmap support

**Modify:** `apps/web/app/(dashboard)/home/_components/DailyQuests.tsx`

**Current state (lines 268-282):** Tag row per quest shows rarity badge + time. **No roadmap source badge exists.**

**Changes:**
1. Add tier chip as first tag (before rarity) — uses 3D embossed style from new `ROADMAP_TIERS` tokens
2. Add filter row component at top — per-roadmap filters (sorted by recency), then "All" last
3. Add collapsible "Completed (N)" section — Phase 1 uses `engine.completedQuests` (client-side Set), Phase 2 uses server `completedToday` array

**Gap:** "Review mode" for completed quests — `QuestJourneyModal` (`quest-journey/QuestJourneyModal.tsx`) has **no review mode**. Needs new `reviewMode?: boolean` prop that hides completion/XP UI.

### FE-4: Quest store changes

**Modify:** `packages/store/src/quest.store.ts`
- **Lines 9-28:** `DailyQuest` interface — add `roadmapId`, `roadmapTitle`, `roadmapTier`
- **Lines 30-42:** `QuestStoreState` — add `completedTodayQuests: DailyQuest[]` + setter

**Modify:** `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts`
- **Line 89:** `Array.isArray(serverQuests)` check — **will break** when response changes to `{ available, completedToday }`. Update to destructure new shape.
- **Lines 134-149:** `serverQuestGroups` groups by `skillDomain` — update to group by `roadmapId`/`roadmapTitle`

**Modify:** `apps/web/app/(dashboard)/home/_utils/quest-templates.ts`
- **Lines 6-22:** `QuestTask` type — add `roadmapId?`, `roadmapTitle?`, `roadmapTier?`, `status?`

**No migration concern:** `quest.store.ts` does not use `persist()` middleware — resets on page reload.

### FE-5: Multi-roadmap quest grouping

**Modify:** `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts`
- **Lines 134-149:** `serverQuestGroups` memo — change `task.skillDomain` grouping to `task.roadmapId`
- **Line 146:** Goal label uses domain string — change to `task.roadmapTitle`
- Sort groups by tier (diamond first) or recency

**Dependency:** Requires BE-2. Phase 1 uses `skillDomain` as proxy.

### FE-6: Milestone Visualization

**Modify:** Extracted `QuestLines.tsx` (from `ActiveQuests.tsx`)

**Current code (ActiveQuests.tsx):**
- **Lines 226-339:** Milestone path rendering
- **Lines 279-320:** Milestone nodes — uses `NeonIcon type={isBoss ? 'trophy' : 'medal'}` (line 305) — correct icons already used
- **Lines 264-265:** Node sizes: boss = 34px/22px icon, regular = 26px/16px icon — needs increase to 54px/28px and 44px/22px per spec
- **Lines 228-252:** Progress track: 3px, `scaleX(progress / 100)` — needs 6px, glowing, shimmer, "flows into" logic
- **Lines 284-288:** Dot backgrounds use semi-transparent colors (`${iconColor}18`, `${t.violet}15`) — **must change to opaque** radial gradients

**Progress line "flows into" logic:**
- Current: `scaleX(progress / 100)` — simple percentage, incorrect
- Required: `scaleX = (activeNodeCenter - trackLeftOffset) / trackWidth`
- With N milestones, active at index i: center at `i / (N - 1)`. Calculate from index, avoid DOM measurement.

**Performance risk:** 7 roadmaps × 5 milestones = 35 nodes, each potentially animating. Existing `prefersReduced` check (ActiveQuests.tsx:85-88) should gate all new animations.

---

## Shared Changes

### Design Tokens
**Modify:** `apps/web/app/(onboarding)/_components/tokens.ts`
- Add `ROADMAP_TIERS` object (separate from existing `LEAGUE_TIERS` at lines 56-61):
```typescript
ROADMAP_TIERS: {
  diamond: { bg: ['#D0F8FF', '#8ED8EC'], text: '#0A3040' },
  gold:    { bg: ['#FFE566', '#D4A800'], text: '#3D2800' },
  silver:  { bg: ['#D8D8D8', '#A0A0A0'], text: '#1A1A1A' },
  bronze:  { bg: ['#D99548', '#A06828'], text: '#2A1500' },
}
```

### i18n Keys
**Modify:** `apps/api/prisma/seed-i18n-full.ts` — add for all 3 locales (en, uk, pl):

| Key | EN | UK |
|-----|----|----|
| `dashboard.next_quest` | Next Quest | Наступний квест |
| `dashboard.continue_quest` | Continue Quest | Продовжити квест |
| `dashboard.begin_quest` | Begin Quest | Почати квест |
| `dashboard.all_done` | All quests completed! | Всі квести завершені! |
| `dashboard.roadmaps` | Roadmaps | Роадмапи |
| `dashboard.manage` | Manage... | Керувати... |
| `dashboard.completed_n` | Completed ({n}) | Пройдено ({n}) |
| `dashboard.filter_all` | All | Всі |
| `tier.diamond` | Diamond | Діамант |
| `tier.gold` | Gold | Золото |
| `tier.silver` | Silver | Срібло |
| `tier.bronze` | Bronze | Бронза |

### Types Package
**Modify:** `packages/types/src/roadmap.ts` — add `RoadmapTier` type, optional `lastAccessedAt`
**Modify:** `packages/types/src/index.ts` — export new type

### Prisma Schema
**Modify:** `apps/api/prisma/schema.prisma` — add `lastAccessedAt DateTime?` to `Roadmap` model (lines 193-220)

---

## Codebase File Inventory

### Files to Modify

| File | Req | Key Lines | Changes |
|------|-----|-----------|---------|
| `apps/api/prisma/schema.prisma` | BE-2 | 193-220 | Add `lastAccessedAt DateTime?` to Roadmap |
| `apps/api/src/quest/quest.service.ts` | BE-1,2 | 51, 59-62, 74-82, 119-133 | New return shape, preserve roadmap context, tier logic |
| `packages/types/src/roadmap.ts` | Types | — | Add `RoadmapTier`, optional `lastAccessedAt` |
| `packages/types/src/index.ts` | Types | — | Export `RoadmapTier` |
| `packages/store/src/quest.store.ts` | FE-4 | 9-28, 30-42 | Extend `DailyQuest`, add `completedTodayQuests` |
| `apps/web/.../useQuestSystem.ts` | FE-4,5 | 89, 134-149 | Handle new response, group by roadmap |
| `apps/web/.../quest-templates.ts` | Types | 6-22 | Extend `QuestTask` with roadmap fields |
| `apps/web/.../DailyQuests.tsx` | FE-3 | 268-282 | Tier badges, filter row, completed section |
| `apps/web/.../ActiveQuests.tsx` | FE-2,6 | 226-339, 264-265, 284-288 | Split → RoadmapCards + QuestLines, milestone overhaul |
| `apps/web/.../page.tsx` | FE-1 | 367-381, 483, 525, 695 | Add ContinueQuestHero, reorder zones |
| `apps/web/.../tokens.ts` | Shared | 56-61 | Add `ROADMAP_TIERS` |
| `apps/api/prisma/seed-i18n-full.ts` | i18n | — | Add 10+ new translation keys × 3 locales |

### New Files to Create

| File | Req | Purpose |
|------|-----|---------|
| `apps/web/.../home/_components/ContinueQuestHero.tsx` | FE-1 | Zone 1: Hero CTA + scene effects |
| `apps/web/.../home/_components/RoadmapCards.tsx` | FE-2 | Zone 2: Horizontal roadmap card row |
| `apps/web/.../home/_components/QuestLines.tsx` | FE-2,6 | Zone 4: Milestone timeline (extracted from ActiveQuests) |

---

## Dependency Graph

```
Types (RoadmapTier) + tokens.ts (ROADMAP_TIERS)
  ├── BE-2 (schema: lastAccessedAt) → BE-1 (return shape)
  │     └── FE-4 (store + hook) → FE-3 (badges/filters) + FE-5 (grouping) + FE-1 (hero CTA data)
  ├── FE-1 (ContinueQuestHero) — can start Phase 1 with existing data
  ├── FE-2 (split ActiveQuests) — independent
  └── FE-6 (milestone viz) — independent, parallel

i18n seed — parallel, needed before release
```

### Phase 1 Implementation Order (no backend changes)
1. `tokens.ts` — add `ROADMAP_TIERS`
2. `quest-templates.ts` — extend `QuestTask` with optional roadmap fields
3. `ContinueQuestHero.tsx` — new component, uses existing quest data
4. Split `ActiveQuests.tsx` → `RoadmapCards.tsx` + `QuestLines.tsx`
5. `QuestLines.tsx` — milestone visualization overhaul (FE-6)
6. `page.tsx` — reorder zones (Hero → RoadmapCards → DailyQuests → QuestLines)
7. `DailyQuests.tsx` — completed section (client-side) + roadmap badges (from `skillDomain`)

### Phase 2 Implementation Order (backend changes)
1. Schema migration (`lastAccessedAt`)
2. `quest.service.ts` — BE-1 + BE-2
3. `quest.store.ts` — new fields + completed array
4. `useQuestSystem.ts` — handle new response shape
5. `DailyQuests.tsx` — full filter row + server-backed completed section
6. `RoadmapCards.tsx` — tier data from server

---

## Gaps & Risks

### GAP-1: `lastAccessedAt` missing in schema
Tier assignment requires `Roadmap.lastAccessedAt` — field does not exist. Needs schema migration (BE-2 prerequisite).

### GAP-2: `WelcomeBack` component overlap
Existing `WelcomeBack` (page.tsx:483) provides warm-up quest CTA. New `ContinueQuestHero` serves same purpose. Decision needed: replace or coexist.

### GAP-3: Review mode missing in QuestJourneyModal
Requirements say "re-open completed quest in review mode." `QuestJourneyModal` has no `reviewMode` prop — needs new mode that hides completion/XP UI.

### GAP-4: Responsive layout for Zone 2
"Horizontal scroll on mobile, grid on desktop (3 per row max)" — React inline styles cannot use media queries. Need `useMediaQuery` hook or CSS class approach.

### RISK-1: Breaking API contract
`quest.daily` return type changes from array to object. If mobile or other consumers exist, they break. Consider `quest.dailyV2` or coordinated deploy.

### RISK-2: Animation performance
35 milestone nodes × 6 animation states. Gate all new animations behind `prefersReducedMotion` check (existing at ActiveQuests.tsx:85-88).

### RISK-3: `noUncheckedIndexedAccess`
All new code indexing arrays/records must handle `T | undefined` (tier color lookup, milestone arrays).

---

## Data Flow

```
getDailyQuests(userId)
  → Query active roadmaps with milestones + tasks
  → Separate: available tasks + today's completed tasks
  → Assign tier to each roadmap (diamond/gold/silver/bronze by recency + velocity)
  → Attach roadmap metadata (id, title, tier) to each task
  → Apply diversity rules (max 2 same type)
  → Return { available: [...], completedToday: [...] }

Frontend:
  useQuestSystem → stores available + completed separately
  ContinueQuestHero → picks highest-priority from available
    (compass icon + swords CTA + ambient glow/particles/fog effects)
  DailyQuests → renders available (3D tier chip first, then rarity/type) + completed section
  RoadmapCards → reads from useRoadmapStore (active card glow + bar shimmer)
  QuestLines → milestone path (medal/trophy nodes, glowing track, teasing locked states)
```

---

## Migration Strategy

### Phase 1 (MVP — this sprint)
- FE-1: Continue Quest hero CTA (uses existing quest data, picks first available) + scene effects
- FE-3 (partial): Completed quests section (client-side tracking via `engine.completedQuests`)
- FE-3 (partial): Roadmap source badges (derive from quest's `skillDomain` as proxy)
- FE-6: Milestone visualization overhaul (medal/trophy, states, progress line logic)
- Reorder zones: Hero CTA (Zone 1) → Roadmap Cards (Zone 2) → Daily Quests (Zone 3) → Quest Lines (Zone 4)

### Phase 2 (Backend support)
- BE-1: Return completed quests from server
- BE-2: Add roadmap metadata + tier to quest response
- FE-2: Separate RoadmapCards component with card effects
- FE-3 (full): Filter row for multi-roadmap filtering + 3D tier chips
- FE-5: Group quests by roadmap

### Phase 3 (Review & Mastery)
- Zone 5: Training Grounds section
- Spaced repetition UI integration
- Knowledge Codex
- Mastery decay visualization

---

## Success Metrics

| Metric | Current | Target | How to measure |
|--------|---------|--------|---------------|
| "Where am I?" clarity | Users must scroll + mental-map | Instant from hero CTA + roadmap cards | User testing |
| Completed quest visibility | 0 (hidden entirely) | 100% of today's completed visible | Feature flag |
| Decision paralysis | All quests equal weight | 1 hero CTA + sorted list | Time-to-first-action |
| Multi-roadmap navigation | No visual separation | 3D tier badges + filter | Quest completion rate per roadmap |
| Review engagement | 0 (no mechanism) | Phase 3 target | Review session count |
| Milestone "pull" effect | Locked milestones invisible | Teasing glow draws users forward | Milestone completion rate |

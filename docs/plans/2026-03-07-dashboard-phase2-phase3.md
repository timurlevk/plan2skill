# Dashboard Redesign — Phase 2 + Phase 3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the dashboard redesign with backend support (completed quests, roadmap tiers, lastAccessedAt), full frontend wire-up (RoadmapCards, filter row, review mode, WelcomeBack removal), and Phase 3 Review & Mastery section.

**Architecture:** Phase 2A = backend (Prisma schema + quest service + progression service). Phase 2B = frontend wire-up (store, hooks, new components). Phase 3 = Training Grounds + review UI. Coordinated deploy — mobile is early stage, no backwards compatibility shim needed.

**Tech Stack:** NestJS 10, Prisma ORM, PostgreSQL, tRPC, Next.js 14, React 19, Zustand, TypeScript strict.

**Prerequisite:** Phase 1 must be complete (ROADMAP_TIERS tokens, ContinueQuestHero, milestone viz, tier chips, keyframes).

---

## Phase 2A — Backend

### Task 1: Schema migration — add lastAccessedAt to Roadmap

**Files:**
- Modify: `apps/api/prisma/schema.prisma:193-220`

**Step 1: Add lastAccessedAt field**

Open `apps/api/prisma/schema.prisma`. Find the Roadmap model (line 193). Add `lastAccessedAt` after `locale` (before `createdAt`):

```prisma
  locale       String   @default("en") @db.VarChar(10)

  lastAccessedAt DateTime? // Dashboard redesign: tier assignment by recency

  createdAt    DateTime @default(now())
```

**Step 2: Generate Prisma client**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill/apps/api && npx prisma generate`
Expected: "✔ Generated Prisma Client"

**Step 3: Create migration**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill/apps/api && npx prisma migrate dev --name add-roadmap-last-accessed`
Expected: Migration created and applied

**Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(schema): add lastAccessedAt to Roadmap for tier assignment"
```

---

### Task 2: Add RoadmapTier type to packages/types

**Files:**
- Modify: `packages/types/src/roadmap.ts`
- Modify: `packages/types/src/index.ts`

**Step 1: Add RoadmapTier type**

Open `packages/types/src/roadmap.ts`. Add at the end of the file:

```typescript
/** Roadmap tier based on user activity recency */
export type RoadmapTier = 'diamond' | 'gold' | 'silver' | 'bronze';
```

**Step 2: Export from index**

Open `packages/types/src/index.ts`. Add the export if not already present:

```typescript
export type { RoadmapTier } from './roadmap';
```

**Step 3: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/types/src/roadmap.ts packages/types/src/index.ts
git commit -m "feat(types): add RoadmapTier type"
```

---

### Task 3: BE-1 + BE-2 — Upgrade getDailyQuests with completed quests + roadmap context

**Files:**
- Modify: `apps/api/src/quest/quest.service.ts:41-134`

This is the core backend change. Three modifications:
1. Preserve roadmap context during flatMap (lines 59-62)
2. Fetch completed task data and return separately
3. Assign tier to each roadmap and attach to response

**Step 1: Add tier assignment helper**

At the top of `QuestService` class (before `getDailyQuests`), add a private helper:

```typescript
  /**
   * Assign diamond/gold/silver/bronze tier to each roadmap based on recency.
   * Diamond = most recent lastAccessedAt + active progress
   * Gold = accessed in last 7 days
   * Silver = accessed in last 30 days
   * Bronze = no recent access
   */
  private assignTiers(roadmaps: Array<{ id: string; lastAccessedAt: Date | null; progress: number }>): Map<string, string> {
    const tiers = new Map<string, string>();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Sort by lastAccessedAt descending (null = never accessed = last)
    const sorted = [...roadmaps].sort((a, b) => {
      const aTime = a.lastAccessedAt?.getTime() ?? 0;
      const bTime = b.lastAccessedAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    sorted.forEach((rm, idx) => {
      if (idx === 0 && rm.lastAccessedAt && rm.progress > 0) {
        tiers.set(rm.id, 'diamond');
      } else if (rm.lastAccessedAt && rm.lastAccessedAt > sevenDaysAgo) {
        tiers.set(rm.id, 'gold');
      } else if (rm.lastAccessedAt && rm.lastAccessedAt > thirtyDaysAgo) {
        tiers.set(rm.id, 'silver');
      } else {
        tiers.set(rm.id, 'bronze');
      }
    });

    return tiers;
  }
```

**Step 2: Modify getDailyQuests — preserve roadmap context during flatMap**

Replace lines 59-62:

```typescript
// OLD:
const candidateTasks = roadmaps.flatMap((r) =>
  r.milestones.flatMap((m) => m.tasks),
);

// NEW:
const candidateTuples = roadmaps.flatMap((r) =>
  r.milestones.flatMap((m) =>
    m.tasks.map((task) => ({
      task,
      roadmapId: r.id,
      roadmapTitle: r.title,
    })),
  ),
);
```

Update all downstream references from `candidateTasks` to `candidateTuples`. The selection logic that filters/sorts tasks needs to work on `candidateTuples[i].task` instead of `candidateTasks[i]`.

After selection, `selected` becomes an array of tuples `{ task, roadmapId, roadmapTitle }`.

**Step 3: Modify response mapping to include roadmap context + tier**

Replace lines 119-133 response mapping. After tier assignment:

```typescript
    const tierMap = this.assignTiers(
      roadmaps.map((r) => ({ id: r.id, lastAccessedAt: r.lastAccessedAt, progress: r.progress })),
    );

    const available = selected.map((tuple) => ({
      id: tuple.task.id,
      title: tuple.task.title,
      description: tuple.task.description,
      taskType: tuple.task.taskType,
      questType: tuple.task.questType,
      estimatedMinutes: tuple.task.estimatedMinutes,
      xpReward: tuple.task.xpReward,
      coinReward: tuple.task.coinReward,
      rarity: tuple.task.rarity,
      difficultyTier: tuple.task.difficultyTier,
      validationType: tuple.task.validationType,
      knowledgeCheck: tuple.task.knowledgeCheck,
      skillDomain: tuple.task.skillDomain,
      roadmapId: tuple.roadmapId,
      roadmapTitle: tuple.roadmapTitle,
      roadmapTier: tierMap.get(tuple.roadmapId) ?? 'bronze',
    }));
```

**Step 4: Add completed quests to response**

After building `completedTaskIds` (line 82), fetch full task data for completed tasks:

```typescript
    // Fetch completed task data for today
    const completedToday = completedTaskIds.size > 0
      ? await this.prisma.task.findMany({
          where: { id: { in: [...completedTaskIds] } },
          include: { milestone: { include: { roadmap: { select: { id: true, title: true, lastAccessedAt: true, progress: true } } } } },
        })
      : [];

    const completedTodayMapped = completedToday.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      questType: task.questType ?? task.taskType,
      estimatedMinutes: task.estimatedMinutes,
      xpReward: task.xpReward,
      coinReward: task.coinReward,
      rarity: task.rarity,
      difficultyTier: task.difficultyTier,
      validationType: task.validationType ?? 'auto',
      knowledgeCheck: task.knowledgeCheck as any,
      skillDomain: task.skillDomain,
      roadmapId: task.milestone?.roadmap?.id ?? '',
      roadmapTitle: task.milestone?.roadmap?.title ?? '',
      roadmapTier: tierMap.get(task.milestone?.roadmap?.id ?? '') ?? 'bronze',
    }));
```

**Step 5: Change return type**

Replace the `return selected.map(...)` with:

```typescript
    return { available, completedToday: completedTodayMapped };
```

**Step 6: Verify build**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: May show errors in frontend consumers (useQuestSystem.ts line 89) — those are fixed in Task 6.

**Step 7: Commit**

```bash
git add apps/api/src/quest/quest.service.ts
git commit -m "feat(api): getDailyQuests returns { available, completedToday } with roadmap context + tier"
```

---

### Task 4: Update lastAccessedAt on quest completion

**Files:**
- Modify: `apps/api/src/progression/progression.service.ts`

**Step 1: Add lastAccessedAt update in completeTask**

Open `apps/api/src/progression/progression.service.ts`. Find the section where roadmap progress is updated (around lines 571-588). After the roadmap progress update, add:

```typescript
    // Update lastAccessedAt for tier assignment
    if (task.milestone?.roadmapId) {
      await this.prisma.roadmap.update({
        where: { id: task.milestone.roadmapId },
        data: { lastAccessedAt: new Date() },
      });
    }
```

**Step 2: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/progression/progression.service.ts
git commit -m "feat(api): update Roadmap.lastAccessedAt on quest completion"
```

---

## Phase 2B — Frontend Wire-up

### Task 5: Update quest.store.ts with new fields

**Files:**
- Modify: `packages/store/src/quest.store.ts`

**Step 1: Extend DailyQuest interface**

Open `packages/store/src/quest.store.ts`. Add new fields to `DailyQuest` (lines 9-28), after `skillDomain`:

```typescript
  skillDomain: string | null;
  roadmapId: string;
  roadmapTitle: string;
  roadmapTier: string; // 'diamond' | 'gold' | 'silver' | 'bronze'
```

**Step 2: Add completedTodayQuests to store state**

In `QuestStoreState` (lines 30-42), add:

```typescript
  /** Today's completed quests from server */
  completedTodayQuests: DailyQuest[];

  setCompletedTodayQuests: (quests: DailyQuest[]) => void;
```

**Step 3: Add setter implementation**

In the `create<QuestStoreState>()` call, add:

```typescript
  completedTodayQuests: [],
  setCompletedTodayQuests: (quests) => set({ completedTodayQuests: quests }),
```

**Step 4: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/store/src/quest.store.ts
git commit -m "feat(store): extend DailyQuest with roadmap fields + completedTodayQuests"
```

---

### Task 6: Update useQuestSystem to handle new response shape

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts`

**Step 1: Fix Array.isArray check (line 89)**

The current code does `Array.isArray(serverQuests)` which will return `false` for the new `{ available, completedToday }` shape. Replace:

```typescript
// OLD (line 89):
if (!Array.isArray(serverQuests)) return null;

// NEW:
const questData = serverQuests as any;
const availableQuests = Array.isArray(questData)
  ? questData                           // backwards compat (old shape)
  : Array.isArray(questData?.available)
    ? questData.available
    : null;
const completedTodayQuests = !Array.isArray(questData) && Array.isArray(questData?.completedToday)
  ? questData.completedToday
  : [];
if (!availableQuests) return null;
```

**Step 2: Update serverQuestGroups to group by roadmapId**

Replace the `serverQuestGroups` useMemo (lines 134-150). Change grouping key from `skillDomain` to `roadmapId`:

```typescript
  const serverQuestGroups = useMemo(() => {
    if (!availableQuests || availableQuests.length === 0) return [];

    const groupMap = new Map<string, {
      goal: { id: string; label: string };
      goalData: { icon?: string } | null;
      tasks: QuestTask[];
    }>();

    for (const task of availableQuests) {
      const groupKey = task.roadmapId || task.skillDomain || 'default';
      const groupLabel = task.roadmapTitle || task.skillDomain || 'Quests';

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          goal: { id: groupKey, label: groupLabel },
          goalData: null,
          tasks: [],
        });
      }

      const questTask = serverTaskToQuestTask(task, groupLabel, '');
      questTask.roadmapId = task.roadmapId;
      questTask.roadmapTitle = task.roadmapTitle;
      questTask.roadmapTier = task.roadmapTier as any;
      groupMap.get(groupKey)!.tasks.push(questTask);
    }

    return Array.from(groupMap.values());
  }, [availableQuests]);
```

**Step 3: Store completed quests from server**

After the quest groups are built, sync `completedTodayQuests` to the store:

```typescript
  useEffect(() => {
    if (completedTodayQuests.length > 0) {
      useQuestStore.getState().setCompletedTodayQuests(completedTodayQuests);
    }
  }, [completedTodayQuests]);
```

**Step 4: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts
git commit -m "feat(dashboard): handle new getDailyQuests response shape + group by roadmapId"
```

---

### Task 7: Remove WelcomeBack, merge logic into ContinueQuestHero

**Files:**
- Delete: `apps/web/app/(dashboard)/home/_components/WelcomeBack.tsx`
- Modify: `apps/web/app/(dashboard)/home/_components/ContinueQuestHero.tsx`
- Modify: `apps/web/app/(dashboard)/home/page.tsx`

**Step 1: Extract getDaysSince and getWelcomeConfig to utils**

Create or modify `apps/web/app/(dashboard)/home/_utils/welcome-utils.ts`:

```typescript
/** Calculate calendar days since a given date string */
export function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const last = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export interface WelcomeConfig {
  title: string;
  titleKey: string;
  subtitle: string;
  subtitleKey: string;
  showWarmup: boolean;
  showBonusBadge: boolean;
  showRefreshLink: boolean;
}

/**
 * Tiered greeting based on absence duration.
 * Returns null if user visited today (no special greeting needed).
 */
export function getWelcomeConfig(daysAbsent: number, isFirstVisit: boolean): WelcomeConfig | null {
  if (isFirstVisit) {
    return {
      title: 'Welcome, hero!',
      titleKey: 'dashboard.welcome_first',
      subtitle: 'Your adventure begins now. Start with an easy quest!',
      subtitleKey: 'dashboard.welcome_first_sub',
      showWarmup: true,
      showBonusBadge: false,
      showRefreshLink: false,
    };
  }
  if (daysAbsent < 1) return null;
  if (daysAbsent <= 3) {
    return {
      title: 'Ready for more!',
      titleKey: 'dashboard.welcome_short',
      subtitle: 'Pick up where you left off.',
      subtitleKey: 'dashboard.welcome_short_sub',
      showWarmup: false,
      showBonusBadge: false,
      showRefreshLink: false,
    };
  }
  if (daysAbsent <= 7) {
    return {
      title: 'We missed you!',
      titleKey: 'dashboard.welcome_week',
      subtitle: 'Start with something easy to get back on track.',
      subtitleKey: 'dashboard.welcome_week_sub',
      showWarmup: true,
      showBonusBadge: false,
      showRefreshLink: false,
    };
  }
  if (daysAbsent <= 30) {
    return {
      title: "Let's refresh!",
      titleKey: 'dashboard.welcome_month',
      subtitle: 'A warm-up quest to get you back in the zone.',
      subtitleKey: 'dashboard.welcome_month_sub',
      showWarmup: true,
      showBonusBadge: true,
      showRefreshLink: false,
    };
  }
  return {
    title: 'Welcome back, hero!',
    titleKey: 'dashboard.welcome_long',
    subtitle: "It's been a while! Let's start fresh.",
    subtitleKey: 'dashboard.welcome_long_sub',
    showWarmup: true,
    showBonusBadge: true,
    showRefreshLink: true,
  };
}
```

**Step 2: Add welcome banner to ContinueQuestHero**

Open `apps/web/app/(dashboard)/home/_components/ContinueQuestHero.tsx`. Add new props:

```typescript
interface ContinueQuestHeroProps {
  nextQuest: QuestTask | null;
  allDone: boolean;
  dailyCompleted: number;
  dailyTotal: number;
  onStartQuest: (taskId: string) => void;
  /** Absence-based welcome config (null = no special greeting) */
  welcomeConfig?: import('../_utils/welcome-utils').WelcomeConfig | null;
}
```

Inside the component, before the main CTA card, render the welcome banner if `welcomeConfig` is not null:

```typescript
  // ── Returning user welcome banner ──
  if (welcomeConfig && !allDone) {
    return (
      <div style={{ marginBottom: 24 }}>
        {/* Welcome message */}
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: `${t.violet}08`, border: `1px solid ${t.violet}15`,
          marginBottom: 12,
        }}>
          <div style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 800,
            color: t.text, marginBottom: 4,
          }}>
            {tr(welcomeConfig.titleKey, welcomeConfig.title)}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          }}>
            {tr(welcomeConfig.subtitleKey, welcomeConfig.subtitle)}
          </div>
          {welcomeConfig.showBonusBadge && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              padding: '3px 10px', borderRadius: 8, marginTop: 8,
              color: t.gold, background: `${t.gold}12`,
            }}>
              ⚡ 2x XP Bonus
            </span>
          )}
        </div>

        {/* Then render the normal CTA below */}
        {nextQuest && renderQuestCard(nextQuest)}
      </div>
    );
  }
```

Extract the existing CTA card rendering into a `renderQuestCard` helper function inside the component.

**Step 3: Remove WelcomeBack from page.tsx**

Open `apps/web/app/(dashboard)/home/page.tsx`.

1. Remove import: `import { WelcomeBack, getDaysSince } from './_components/WelcomeBack';`
2. Add import: `import { getDaysSince, getWelcomeConfig } from './_utils/welcome-utils';`
3. Remove the `<WelcomeBack ... />` block (lines 483-497)
4. Add `welcomeConfig` prop to `<ContinueQuestHero>`:

```typescript
      <ContinueQuestHero
        nextQuest={getNextQuest()}
        allDone={dailyCompleted >= dailyTotal && dailyTotal > 0}
        dailyCompleted={dailyCompleted}
        dailyTotal={dailyTotal}
        onStartQuest={setOpenQuestId}
        welcomeConfig={getWelcomeConfig(daysAbsent, isFirstVisit)}
      />
```

**Step 4: Delete WelcomeBack.tsx**

Run: `rm apps/web/app/(dashboard)/home/_components/WelcomeBack.tsx`

Verify no other imports reference it.

**Step 5: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/app/(dashboard)/home/_utils/welcome-utils.ts apps/web/app/(dashboard)/home/_components/ContinueQuestHero.tsx apps/web/app/(dashboard)/home/page.tsx
git rm apps/web/app/(dashboard)/home/_components/WelcomeBack.tsx
git commit -m "feat(dashboard): replace WelcomeBack with merged ContinueQuestHero welcome banner"
```

---

### Task 8: Split ActiveQuests into RoadmapCards + QuestLines

**Files:**
- Create: `apps/web/app/(dashboard)/home/_components/RoadmapCards.tsx`
- Create: `apps/web/app/(dashboard)/home/_components/QuestLines.tsx`
- Modify: `apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx` (slim down to re-export)
- Modify: `apps/web/app/(dashboard)/home/page.tsx`

**Step 1: Create QuestLines.tsx**

Extract milestone visualization (lines 101-394 of ActiveQuests.tsx minus the card header portion) into `QuestLines.tsx`. This is the Zone 4 component with the full milestone path, sparkle particles, and quest line cards.

The component receives the same props as `ActiveQuests`:

```typescript
interface QuestLinesProps {
  selectedGoals: GoalSelection[];
  skillAssessments: SkillAssessment[];
}
```

Copy the full rendering logic from `ActiveQuests.tsx` (lines 78-394) into this new component. Include the mock roadmap builder (lines 12-71) — it stays here as pre-auth fallback.

**Step 2: Create RoadmapCards.tsx**

New Zone 2 component — horizontal scrollable row of condensed roadmap summary cards:

```typescript
'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoadmapStore, useOnboardingStore, useI18nStore } from '@plan2skill/store';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity, skillLevelRarity, ROADMAP_TIERS } from '../../../(onboarding)/_components/tokens';
import type { GoalSelection, SkillAssessment, Roadmap } from '@plan2skill/types';

interface RoadmapCardsProps {
  selectedGoals: GoalSelection[];
  skillAssessments: SkillAssessment[];
}

export function RoadmapCards({ selectedGoals, skillAssessments }: RoadmapCardsProps) {
  const tr = useI18nStore((s) => s.t);
  const router = useRouter();
  const serverRoadmaps = useRoadmapStore((s) => s.roadmaps);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const prefersReduced = useRef(false);
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const roadmaps = useMemo<Roadmap[]>(() => {
    if (serverRoadmaps.length > 0) return serverRoadmaps;
    return [];
  }, [serverRoadmaps]);

  if (roadmaps.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', margin: 0,
        }}>
          <NeonIcon type="map" size={14} color="cyan" />
          {tr('dashboard.roadmaps', 'Roadmaps')}
        </h2>
        {roadmaps.length > 1 && (
          <button
            onClick={() => router.push('/roadmaps')}
            style={{
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: t.textMuted, background: 'transparent',
              border: 'none', cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            {tr('dashboard.manage', 'Manage...')}
          </button>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto',
        paddingBottom: 8,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>
        {roadmaps.map((rm, i) => {
          const isActive = rm.status === 'active';
          const isCompleted = rm.status === 'completed';
          const activeMilestone = rm.milestones.find((m) => m.status === 'active');
          const progress = Math.round(rm.progress);
          const totalQuests = rm.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
          const completedQuests = rm.milestones.reduce(
            (sum, m) => sum + m.tasks.filter((tk) => tk.status === 'completed').length, 0,
          );

          const goal = selectedGoals.find((g) => rm.goal === g.label);
          const assessment = goal ? skillAssessments.find((a) => a.goalId === goal.id) : null;
          const lr = assessment ? skillLevelRarity[assessment.level as keyof typeof skillLevelRarity] : rarity.common;

          return (
            <button
              key={rm.id}
              onClick={() => router.push(`/roadmap/${rm.id}`)}
              onMouseEnter={() => setHoveredCard(rm.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                minWidth: 220, maxWidth: 280, flex: '0 0 auto',
                scrollSnapAlign: 'start',
                padding: 16, borderRadius: 14,
                background: t.bgCard,
                border: `1px solid ${hoveredCard === rm.id ? t.violet : t.border}`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
                transform: hoveredCard === rm.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredCard === rm.id ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
                animation: isActive && !prefersReduced.current
                  ? `fadeUp 0.3s ease-out ${i * 0.08}s both, cardBreath 3s ease-in-out infinite`
                  : `fadeUp 0.3s ease-out ${i * 0.08}s both`,
              }}
            >
              {/* Title */}
              <div style={{
                fontFamily: t.display, fontSize: 13, fontWeight: 700,
                color: t.text, marginBottom: 6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {rm.title}
              </div>

              {/* Skill level badge */}
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontFamily: t.mono, fontSize: 8, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 8,
                  color: lr.color, background: `${lr.color}12`,
                  textTransform: 'uppercase',
                }}>
                  {lr.icon} {assessment?.level || 'beginner'}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 2, background: t.border,
                overflow: 'hidden', marginBottom: 8, position: 'relative',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: isCompleted ? t.gold : t.gradient,
                  width: `${Math.max(progress, 2)}%`,
                  transition: 'width 0.6s ease-out',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {!prefersReduced.current && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'barShimmer 2.5s ease-in-out infinite',
                    }} />
                  )}
                </div>
              </div>

              {/* Footer: milestone + count */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: t.body, fontSize: 10, color: t.textMuted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '60%',
                }}>
                  {isCompleted
                    ? tr('quest.all_conquered', 'All milestones conquered!')
                    : activeMilestone?.title ?? tr('quest.ready', 'Ready to begin')}
                </span>
                <span style={{
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: isCompleted ? t.gold : t.cyan,
                }}>
                  {progress}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 3: Update ActiveQuests.tsx to re-export**

Slim `ActiveQuests.tsx` down to a thin wrapper that renders both components, or delete it and update page.tsx imports. Recommended: keep ActiveQuests as barrel export for backwards compatibility:

```typescript
'use client';

// ActiveQuests is now split into RoadmapCards (Zone 2) + QuestLines (Zone 4).
// This file re-exports QuestLines for backwards compatibility.
export { QuestLines as ActiveQuests } from './QuestLines';
```

**Step 4: Update page.tsx imports and layout**

```typescript
import { RoadmapCards } from './_components/RoadmapCards';
import { QuestLines } from './_components/QuestLines';
// Remove: import { ActiveQuests } from './_components/ActiveQuests';
```

In the layout, insert `<RoadmapCards>` between ContinueQuestHero and DailyQuests:

```typescript
      {/* Zone 2: Roadmap Cards */}
      <RoadmapCards
        selectedGoals={selectedGoals}
        skillAssessments={skillAssessments}
      />
```

Replace `<ActiveQuests>` with `<QuestLines>`:
```typescript
      {/* Zone 4: Quest Lines */}
      <QuestLines
        selectedGoals={selectedGoals}
        skillAssessments={skillAssessments}
      />
```

**Step 5: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/RoadmapCards.tsx apps/web/app/(dashboard)/home/_components/QuestLines.tsx apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx apps/web/app/(dashboard)/home/page.tsx
git commit -m "feat(dashboard): split ActiveQuests into RoadmapCards (Zone 2) + QuestLines (Zone 4)"
```

---

### Task 9: Add filter row to DailyQuests for multi-roadmap filtering

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/DailyQuests.tsx`

**Step 1: Add filter state and filter row UI**

At the top of the `DailyQuests` component, add filter state:

```typescript
const [activeFilter, setActiveFilter] = useState<string>('all');
```

Compute unique roadmaps from quest groups:

```typescript
const roadmapFilters = useMemo(() => {
  const seen = new Map<string, string>(); // roadmapId → roadmapTitle
  for (const group of questGroups) {
    for (const task of group.tasks) {
      if (task.roadmapId && task.roadmapTitle && !seen.has(task.roadmapId)) {
        seen.set(task.roadmapId, task.roadmapTitle);
      }
    }
  }
  return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
}, [questGroups]);
```

Render filter row before the quest list:

```typescript
      {/* Filter row — per-roadmap filters */}
      {roadmapFilters.length > 1 && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          marginBottom: 12, paddingBottom: 8,
        }}>
          {roadmapFilters.map((rf) => {
            const isActive = activeFilter === rf.id;
            return (
              <button
                key={rf.id}
                onClick={() => setActiveFilter(isActive ? 'all' : rf.id)}
                style={{
                  padding: '4px 12px', borderRadius: 10,
                  background: isActive ? `${t.violet}15` : 'transparent',
                  border: `1px solid ${isActive ? t.violet : t.border}`,
                  cursor: 'pointer',
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  color: isActive ? t.violet : t.textMuted,
                  transition: 'all 0.15s ease',
                }}
              >
                {rf.title}
              </button>
            );
          })}
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '4px 12px', borderRadius: 10,
              background: activeFilter === 'all' ? `${t.violet}15` : 'transparent',
              border: `1px solid ${activeFilter === 'all' ? t.violet : t.border}`,
              cursor: 'pointer',
              fontFamily: t.mono, fontSize: 10, fontWeight: 700,
              color: activeFilter === 'all' ? t.violet : t.textMuted,
              transition: 'all 0.15s ease',
            }}
          >
            {tr('dashboard.filter_all', 'All')}
          </button>
        </div>
      )}
```

**Step 2: Filter quest groups by selected roadmap**

Before rendering quest groups, filter:

```typescript
const filteredGroups = activeFilter === 'all'
  ? questGroups
  : questGroups.map((g) => ({
      ...g,
      tasks: g.tasks.filter((task) => task.roadmapId === activeFilter),
    })).filter((g) => g.tasks.length > 0);
```

Use `filteredGroups` instead of `questGroups` in the rendering loop.

**Step 3: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/DailyQuests.tsx
git commit -m "feat(dashboard): add per-roadmap filter row to DailyQuests"
```

---

### Task 10: Add review mode to QuestJourneyModal

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/quest-journey/QuestJourneyModal.tsx`

**Step 1: Add reviewMode prop**

In `QuestJourneyModalProps` (lines 35-49), add:

```typescript
  /** Review mode — completed quest read-only, no XP reward */
  reviewMode?: boolean;
```

**Step 2: Gate completion UI in review mode**

In the phase state machine, when `reviewMode` is true:
- Start at `'briefing'` phase as normal
- Allow navigation to `'content'` phase
- **Skip** `'trial'` and `'complete'` phases
- Replace the "Complete" / "Mark Done" button with "Close Review" button
- Hide XP display, bonus roll, and celebration UI

Find the button that triggers `onToggle` (the completion action). Wrap it:

```typescript
{!reviewMode && (
  // existing complete/toggle button
)}
{reviewMode && (
  <button onClick={onClose} style={{
    padding: '10px 24px', borderRadius: 12,
    background: t.bgElevated, border: `1px solid ${t.border}`,
    cursor: 'pointer',
    fontFamily: t.display, fontSize: 13, fontWeight: 700,
    color: t.textSecondary,
  }}>
    {tr('quest.close_review', 'Close Review')}
  </button>
)}
```

**Step 3: Wire review mode from DailyQuests completed section**

In `DailyQuests.tsx`, the completed quest items should open the modal in review mode. The `onOpenQuest` callback needs a way to signal review mode.

Option: Add `onOpenQuestReview?: (taskId: string) => void` prop to DailyQuests. In page.tsx, handle it by opening the modal with `reviewMode: true`.

**Step 4: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/quest-journey/QuestJourneyModal.tsx apps/web/app/(dashboard)/home/_components/DailyQuests.tsx apps/web/app/(dashboard)/home/page.tsx
git commit -m "feat(dashboard): add review mode to QuestJourneyModal for completed quest review"
```

---

### Task 11: Phase 2 i18n keys

**Files:**
- Modify: `apps/api/prisma/seed-i18n-full.ts`

**Step 1: Add Phase 2 translation keys**

| Key | EN | UK | PL |
|-----|----|----|-----|
| `dashboard.roadmaps` | Roadmaps | Роадмапи | Mapy drogowe |
| `dashboard.manage` | Manage... | Керувати... | Zarządzaj... |
| `dashboard.filter_all` | All | Всі | Wszystkie |
| `dashboard.welcome_first` | Welcome, hero! | Вітаємо, герою! | Witaj, bohaterze! |
| `dashboard.welcome_first_sub` | Your adventure begins now. Start with an easy quest! | Твоя пригода починається! Почни з легкого квесту! | Twoja przygoda się zaczyna! Zacznij od łatwej misji! |
| `dashboard.welcome_short` | Ready for more! | Готовий до нових звершень! | Gotowy na więcej! |
| `dashboard.welcome_week` | We missed you! | Ми сумували! | Tęskniliśmy! |
| `dashboard.welcome_month` | Let's refresh! | Давай оновимо знання! | Odśwież wiedzę! |
| `dashboard.welcome_long` | Welcome back, hero! | З поверненням, герою! | Witaj z powrotem, bohaterze! |
| `quest.close_review` | Close Review | Закрити огляд | Zamknij przegląd |
| `tier.diamond` | Diamond | Діамант | Diament |
| `tier.gold` | Gold | Золото | Złoto |
| `tier.silver` | Silver | Срібло | Srebro |
| `tier.bronze` | Bronze | Бронза | Brąz |

**Step 2: Commit**

```bash
git add apps/api/prisma/seed-i18n-full.ts
git commit -m "feat(i18n): add Phase 2 dashboard translation keys (en, uk, pl)"
```

---

### Task 12: Phase 2 integration testing

**Step 1: Run full typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 2: Run Prisma generate + verify migration**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill/apps/api && npx prisma generate`
Expected: PASS

**Step 3: Run lint**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm lint`
Expected: PASS or pre-existing warnings only

**Step 4: Visual smoke test**

Run: `pnpm dev` and verify:
1. **getDailyQuests** returns `{ available, completedToday }` — check network tab
2. **Tier chips** show correct tier (diamond/gold/silver/bronze) from server
3. **Filter row** appears when 2+ roadmaps, filters work
4. **RoadmapCards** show horizontal scrollable cards (Zone 2)
5. **QuestLines** still render correctly (Zone 4)
6. **Completed quests** section shows server-backed completed tasks
7. **Review mode** opens QuestJourneyModal without XP UI
8. **Welcome banner** shows for returning users (daysAbsent > 0)
9. **No WelcomeBack** component rendered
10. **lastAccessedAt** updates on quest completion

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(dashboard): Phase 2 complete — backend wire-up, RoadmapCards, filter row, review mode"
```

---

## Phase 3 — Review & Mastery

### Task 13: Create TrainingGrounds container component

**Files:**
- Create: `apps/web/app/(dashboard)/home/_components/TrainingGrounds.tsx`

**Step 1: Create component skeleton**

The Training Grounds is Zone 5 — a section for reviewing learned material via spaced repetition.

```typescript
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { MasteryRing } from './MasteryRing';

interface TrainingGroundsProps {
  skills: Array<{
    skillId: string;
    skillDomain: string;
    masteryLevel: number;
    isOverdue: boolean;
    lastReviewedAt: string | null;
    nextReviewAt: string | null;
  }>;
  overallMastery: number;
  dueCount: number;
  dueItems: Array<{
    skillId: string;
    skillDomain: string;
    masteryLevel: number;
  }>;
  onStartReview: (skillId: string) => void;
  isSubmitting: boolean;
}

export function TrainingGrounds({
  skills,
  overallMastery,
  dueCount,
  dueItems,
  onStartReview,
  isSubmitting,
}: TrainingGroundsProps) {
  const tr = useI18nStore((s) => s.t);
  const [expanded, setExpanded] = useState(false);
  const prefersReduced = useRef(false);
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  if (skills.length === 0) return null;

  return (
    <div style={{ marginTop: 32, marginBottom: 32 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h2 style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: t.display, fontSize: 13, fontWeight: 700,
          color: t.textSecondary, textTransform: 'uppercase',
          letterSpacing: '0.08em', margin: 0,
        }}>
          <NeonIcon type="shield" size={14} color="cyan" />
          {tr('dashboard.training_grounds', 'Training Grounds')}
        </h2>
        {dueCount > 0 && (
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 800,
            padding: '3px 10px', borderRadius: 10,
            color: t.rose, background: `${t.rose}12`,
          }}>
            {dueCount} {tr('dashboard.reviews_due', 'reviews due')}
          </span>
        )}
      </div>

      {/* Overall mastery bar */}
      <div style={{
        padding: 16, borderRadius: 14,
        background: t.bgCard, border: `1px solid ${t.border}`,
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{ fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text }}>
            {tr('dashboard.overall_mastery', 'Overall Mastery')}
          </span>
          <span style={{ fontFamily: t.mono, fontSize: 12, fontWeight: 800, color: t.cyan }}>
            {Math.round(overallMastery * 100)}%
          </span>
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: t.border,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: t.gradient,
            width: `${Math.max(overallMastery * 100, 2)}%`,
            transition: 'width 0.6s ease-out',
          }} />
        </div>
      </div>

      {/* Due reviews — urgent action cards */}
      {dueItems.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {dueItems.map((item) => (
            <button
              key={item.skillId}
              onClick={() => onStartReview(item.skillId)}
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', textAlign: 'left',
                padding: '12px 14px', borderRadius: 12,
                background: `${t.rose}06`, border: `1px solid ${t.rose}20`,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginBottom: 6,
                transition: 'background 0.15s ease',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <MasteryRing
                masteryLevel={item.masteryLevel}
                skillDomain={item.skillDomain}
                isOverdue
                size="sm"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.text,
                }}>
                  {item.skillDomain}
                </div>
                <div style={{
                  fontFamily: t.body, fontSize: 11, color: t.rose,
                }}>
                  {tr('mastery.review_now', 'Review now to maintain mastery')}
                </div>
              </div>
              <NeonIcon type="swords" size={16} color={t.rose} />
            </button>
          ))}
        </div>
      )}

      {/* All skills — expandable grid */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 10,
          background: 'transparent', border: `1px solid ${t.border}`,
          cursor: 'pointer', width: '100%', textAlign: 'left',
        }}
      >
        <NeonIcon type="book" size={12} color="cyan" />
        <span style={{
          fontFamily: t.display, fontSize: 12, fontWeight: 700,
          color: t.textSecondary, flex: 1,
        }}>
          {tr('dashboard.knowledge_codex', 'Knowledge Codex ({n} skills)').replace('{n}', String(skills.length))}
        </span>
        <span style={{
          fontFamily: t.mono, fontSize: 10, color: t.textMuted,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }}>
          ▼
        </span>
      </button>

      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8, marginTop: 8,
          animation: 'fadeUp 0.2s ease-out',
        }}>
          {skills.map((skill) => (
            <button
              key={skill.skillId}
              onClick={() => onStartReview(skill.skillId)}
              disabled={isSubmitting}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: 12, borderRadius: 12,
                background: t.bgCard, border: `1px solid ${skill.isOverdue ? `${t.rose}30` : t.border}`,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <MasteryRing
                masteryLevel={skill.masteryLevel}
                skillDomain={skill.skillDomain}
                isOverdue={skill.isOverdue}
                size="md"
                showLabel
              />
              <span style={{
                fontFamily: t.mono, fontSize: 9, fontWeight: 600,
                color: t.textMuted, textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', width: '100%',
              }}>
                {skill.skillDomain}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/TrainingGrounds.tsx
git commit -m "feat(dashboard): add TrainingGrounds component (Zone 5) with mastery rings + knowledge codex"
```

---

### Task 14: Wire TrainingGrounds into page.tsx

**Files:**
- Modify: `apps/web/app/(dashboard)/home/page.tsx`

**Step 1: Import TrainingGrounds**

```typescript
import { TrainingGrounds } from './_components/TrainingGrounds';
```

**Step 2: Add review handler**

In the page component, add a review state and handler:

```typescript
  const [reviewSkillId, setReviewSkillId] = useState<string | null>(null);

  const handleStartReview = useCallback((skillId: string) => {
    // For now, submit a quick review (quality=3 = OK)
    // Future: open a ReviewModal with quiz/flashcard UI
    mastery.submitReview(skillId, 3);
  }, [mastery]);
```

**Step 3: Insert TrainingGrounds after QuestLines (Zone 4)**

After the `<QuestLines>` component, add:

```typescript
      {/* Zone 5: Training Grounds — review & mastery */}
      <TrainingGrounds
        skills={mastery.skills}
        overallMastery={mastery.overallMastery}
        dueCount={mastery.dueCount}
        dueItems={mastery.dueItems}
        onStartReview={handleStartReview}
        isSubmitting={mastery.isSubmitting}
      />
```

**Step 4: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/(dashboard)/home/page.tsx
git commit -m "feat(dashboard): wire TrainingGrounds (Zone 5) into dashboard page"
```

---

### Task 15: Create ReviewModal for spaced repetition review sessions

**Files:**
- Create: `apps/web/app/(dashboard)/home/_components/ReviewModal.tsx`
- Modify: `apps/web/app/(dashboard)/home/page.tsx`

**Step 1: Create ReviewModal component**

Simple flashcard-style review modal where users rate their recall quality (1-5 SM-2 scale):

```typescript
'use client';

import React, { useState } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import { MasteryRing } from './MasteryRing';

interface ReviewModalProps {
  skillDomain: string;
  masteryLevel: number;
  onSubmit: (quality: number) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const QUALITY_OPTIONS = [
  { value: 1, label: 'Forgot', labelKey: 'review.forgot', color: '#FF6B6B', icon: 'x' as const },
  { value: 2, label: 'Hard', labelKey: 'review.hard', color: '#FFA94D', icon: 'fire' as const },
  { value: 3, label: 'OK', labelKey: 'review.ok', color: '#FFD93D', icon: 'check' as const },
  { value: 4, label: 'Easy', labelKey: 'review.easy', color: '#69DB7C', icon: 'sparkle' as const },
  { value: 5, label: 'Perfect', labelKey: 'review.perfect', color: '#4ECDC4', icon: 'crown' as const },
];

export function ReviewModal({ skillDomain, masteryLevel, onSubmit, onClose, isSubmitting }: ReviewModalProps) {
  const tr = useI18nStore((s) => s.t);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          padding: 28, borderRadius: 20,
          background: t.bgCard, border: `1px solid ${t.border}`,
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <MasteryRing
            masteryLevel={masteryLevel}
            skillDomain={skillDomain}
            size="lg"
            showLabel
            style={{ margin: '0 auto 12px' }}
          />
          <div style={{
            fontFamily: t.display, fontSize: 18, fontWeight: 800, color: t.text,
          }}>
            {skillDomain}
          </div>
          <div style={{
            fontFamily: t.body, fontSize: 13, color: t.textSecondary, marginTop: 4,
          }}>
            {tr('review.how_well', 'How well do you remember this topic?')}
          </div>
        </div>

        {/* Quality buttons */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20,
        }}>
          {QUALITY_OPTIONS.map((opt) => {
            const isSelected = selectedQuality === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedQuality(opt.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, padding: '10px 12px', borderRadius: 12,
                  background: isSelected ? `${opt.color}20` : t.bgElevated,
                  border: `2px solid ${isSelected ? opt.color : t.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  minWidth: 56,
                }}
              >
                <NeonIcon type={opt.icon} size={16} color={opt.color} />
                <span style={{
                  fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                  color: isSelected ? opt.color : t.textMuted,
                }}>
                  {tr(opt.labelKey, opt.label)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit / Cancel */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 12,
              background: 'transparent', border: `1px solid ${t.border}`,
              cursor: 'pointer',
              fontFamily: t.display, fontSize: 13, fontWeight: 700, color: t.textMuted,
            }}
          >
            {tr('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={() => selectedQuality && onSubmit(selectedQuality)}
            disabled={!selectedQuality || isSubmitting}
            style={{
              flex: 2, padding: '10px 16px', borderRadius: 12,
              background: selectedQuality ? t.gradient : t.bgElevated,
              border: 'none', cursor: selectedQuality ? 'pointer' : 'not-allowed',
              fontFamily: t.display, fontSize: 13, fontWeight: 800,
              color: selectedQuality ? '#fff' : t.textMuted,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting
              ? tr('review.submitting', 'Submitting...')
              : tr('review.submit', 'Submit Review')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Wire into page.tsx**

Update the review handler to open ReviewModal:

```typescript
  const [reviewSkillId, setReviewSkillId] = useState<string | null>(null);

  const handleStartReview = useCallback((skillId: string) => {
    setReviewSkillId(skillId);
  }, []);

  const handleSubmitReview = useCallback(async (quality: number) => {
    if (!reviewSkillId) return;
    await mastery.submitReview(reviewSkillId, quality);
    setReviewSkillId(null);
  }, [reviewSkillId, mastery]);
```

Add ReviewModal render:

```typescript
      {/* Review Modal */}
      {reviewSkillId && (() => {
        const skill = mastery.skills.find((s) => s.skillId === reviewSkillId);
        if (!skill) return null;
        return (
          <ReviewModal
            skillDomain={skill.skillDomain}
            masteryLevel={skill.masteryLevel}
            onSubmit={handleSubmitReview}
            onClose={() => setReviewSkillId(null)}
            isSubmitting={mastery.isSubmitting}
          />
        );
      })()}
```

**Step 3: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/ReviewModal.tsx apps/web/app/(dashboard)/home/page.tsx
git commit -m "feat(dashboard): add ReviewModal with SM-2 quality rating for spaced repetition"
```

---

### Task 16: Add mastery decay visualization to MasteryRing

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/MasteryRing.tsx`

**Step 1: Add decay visual**

Open `apps/web/app/(dashboard)/home/_components/MasteryRing.tsx`. The component already supports `isOverdue` prop (shows red pulse dot at lines 150-165).

Add decay visual: when a skill is overdue, the ring progress should show a subtle "fading" effect — the ring stroke opacity decreases proportionally to how overdue it is.

After the `isOverdue` prop check, compute decay factor:

```typescript
  // Decay visualization: ring fades when overdue
  const decayOpacity = isOverdue ? 0.5 : 1;
```

Apply to the ring stroke:

```typescript
  <circle
    ...existing props...
    style={{
      ...existing styles...
      opacity: decayOpacity,
      transition: 'opacity 0.3s ease',
    }}
  />
```

Add a "cracking" dashed overlay ring for severely overdue skills (optional):

```typescript
  {isOverdue && (
    <circle
      cx={center} cy={center} r={radius}
      fill="none"
      stroke={t.rose}
      strokeWidth={strokeWidth * 0.3}
      strokeDasharray="2 4"
      opacity={0.3}
      style={{ transition: 'opacity 0.3s ease' }}
    />
  )}
```

**Step 2: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/MasteryRing.tsx
git commit -m "feat(dashboard): add decay visual to MasteryRing — faded ring + crack overlay when overdue"
```

---

### Task 17: Phase 3 i18n keys

**Files:**
- Modify: `apps/api/prisma/seed-i18n-full.ts`

**Step 1: Add Phase 3 translation keys**

| Key | EN | UK | PL |
|-----|----|----|-----|
| `dashboard.training_grounds` | Training Grounds | Тренувальний полігон | Poligon treningowy |
| `dashboard.reviews_due` | reviews due | огляди очікують | recenzje do wykonania |
| `dashboard.overall_mastery` | Overall Mastery | Загальне опанування | Ogólne opanowanie |
| `dashboard.knowledge_codex` | Knowledge Codex ({n} skills) | Кодекс знань ({n} навичок) | Kodeks wiedzy ({n} umiejętności) |
| `mastery.review_now` | Review now to maintain mastery | Переглянь зараз для збереження навичок | Powtórz teraz, aby utrzymać biegłość |
| `review.how_well` | How well do you remember this topic? | Як добре ти пам'ятаєш цю тему? | Jak dobrze pamiętasz ten temat? |
| `review.forgot` | Forgot | Забув | Zapomniałem |
| `review.hard` | Hard | Важко | Trudne |
| `review.ok` | OK | Нормально | OK |
| `review.easy` | Easy | Легко | Łatwe |
| `review.perfect` | Perfect | Ідеально | Idealnie |
| `review.submit` | Submit Review | Надіслати огляд | Wyślij recenzję |
| `review.submitting` | Submitting... | Надсилаємо... | Wysyłanie... |

**Step 2: Commit**

```bash
git add apps/api/prisma/seed-i18n-full.ts
git commit -m "feat(i18n): add Phase 3 Training Grounds + Review translation keys (en, uk, pl)"
```

---

### Task 18: Final integration testing — Phase 2 + Phase 3

**Step 1: Full typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 2: Prisma generate**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill/apps/api && npx prisma generate`
Expected: PASS

**Step 3: Lint**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm lint`
Expected: PASS

**Step 4: Full visual smoke test**

Run: `pnpm dev` and verify complete dashboard flow:

**Phase 2 checks:**
1. ✅ Network tab: `quest.daily` returns `{ available, completedToday }`
2. ✅ Tier chips use server-provided tier (diamond→bronze)
3. ✅ Filter row with 2+ roadmaps, toggles work
4. ✅ RoadmapCards: horizontal scroll, card glow, progress bar shimmer
5. ✅ QuestLines: milestone viz with correct line+dot rendering
6. ✅ Completed section: server-backed, opens review mode
7. ✅ Review mode: QuestJourneyModal without XP/completion UI
8. ✅ Welcome banner: shows for returning users
9. ✅ No WelcomeBack component
10. ✅ lastAccessedAt updates on quest completion

**Phase 3 checks:**
11. ✅ TrainingGrounds section visible when skills exist
12. ✅ Due reviews: red-bordered cards with "Review now"
13. ✅ Knowledge Codex: expandable grid of mastery rings
14. ✅ ReviewModal: opens with SM-2 quality buttons
15. ✅ MasteryRing decay: faded rings + crack overlay for overdue
16. ✅ Overall mastery bar reflects actual data

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): Phase 2+3 complete — full backend wire-up, Training Grounds, ReviewModal, mastery decay"
```

---

## Dependency Graph

```
Phase 2A — Backend:
  Task 1 (schema migration) ──> Task 3 (BE-1 + BE-2: quest service)
  Task 2 (RoadmapTier type) ──> Task 3
  Task 3 ──> Task 4 (lastAccessedAt on completion)

Phase 2B — Frontend:
  Task 3 ──> Task 5 (quest.store.ts)
  Task 5 ──> Task 6 (useQuestSystem new shape)
  Task 6 ──> Task 7 (WelcomeBack removal + merge)
  Task 6 ──> Task 8 (RoadmapCards + QuestLines split)
  Task 6 ──> Task 9 (filter row)
  Task 6 ──> Task 10 (review mode)
  Task 11 (i18n) — independent

Phase 3:
  Task 6 ──> Task 13 (TrainingGrounds)
  Task 13 ──> Task 14 (wire into page)
  Task 14 ──> Task 15 (ReviewModal)
  Task 15 ──> Task 16 (mastery decay)
  Task 17 (i18n) — independent
  Task 18 (integration test) — after all
```

**Critical path:** T1 → T3 → T5 → T6 → T8 → T14 → T15 → T18

**Parallelizable:**
- Tasks 1+2 in parallel
- Tasks 7, 8, 9, 10 in parallel (after T6)
- Tasks 11, 17 independent of everything
- Task 16 independent of T13-T15 flow

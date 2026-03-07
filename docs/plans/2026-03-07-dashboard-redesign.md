# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the quest dashboard home screen with a CTA hero, 3D tier chips, upgraded milestone visualization, completed quests section, and reordered information hierarchy.

**Architecture:** Frontend-only Phase 1 — all changes in `apps/web`. No backend changes yet. New `ContinueQuestHero` component, split `ActiveQuests` into `RoadmapCards` + `QuestLines`, extend `DailyQuests` with tier chips and completed section. All styling via inline styles with tokens from `tokens.ts`.

**Tech Stack:** Next.js 14 (App Router), React 19, TypeScript strict (`noUncheckedIndexedAccess: true`), Zustand stores, inline styles (no CSS framework), NeonIcon SVG system.

---

### Task 1: Add ROADMAP_TIERS tokens and keyframes

**Files:**
- Modify: `apps/web/app/(onboarding)/_components/tokens.ts:61` (after `LEAGUE_TIERS`)
- Modify: `apps/web/app/(dashboard)/layout.tsx:443` (before `@media (prefers-reduced-motion)`)

**Step 1: Add ROADMAP_TIERS to tokens.ts**

Open `apps/web/app/(onboarding)/_components/tokens.ts`. After line 61 (`} as const;` closing `LEAGUE_TIERS`), add:

```typescript
// Roadmap tier colors — ranked by user activity (diamond = most active)
export const ROADMAP_TIERS = {
  diamond: {
    bg: 'linear-gradient(180deg, #D0F8FF 0%, #8ED8EC 100%)',
    text: '#0A3040',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,60,80,0.2), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
    label: 'Diamond',
  },
  gold: {
    bg: 'linear-gradient(180deg, #FFE566 0%, #D4A800 100%)',
    text: '#3D2800',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(100,60,0,0.25), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.25)',
    label: 'Gold',
  },
  silver: {
    bg: 'linear-gradient(180deg, #D8D8D8 0%, #A0A0A0 100%)',
    text: '#1A1A1A',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.35)',
    label: 'Silver',
  },
  bronze: {
    bg: 'linear-gradient(180deg, #D99548 0%, #A06828 100%)',
    text: '#2A1500',
    shadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(80,30,0,0.25), 0 1px 3px rgba(0,0,0,0.4)',
    textShadow: '0 1px 0 rgba(255,255,255,0.15)',
    label: 'Bronze',
  },
} as const;

export type RoadmapTier = keyof typeof ROADMAP_TIERS;
```

**Step 2: Add new keyframes to layout.tsx**

Open `apps/web/app/(dashboard)/layout.tsx`. Before the `@media (prefers-reduced-motion: reduce)` block at line 444, add these keyframes:

```css
@keyframes ctaAmbient {
  0%, 100% { box-shadow: 0 0 30px rgba(157,122,255,0.08), 0 0 60px rgba(78,205,196,0.04); border-color: rgba(157,122,255,0.15); }
  50% { box-shadow: 0 0 50px rgba(157,122,255,0.18), 0 0 90px rgba(78,205,196,0.08), 0 0 120px rgba(157,122,255,0.04); border-color: rgba(157,122,255,0.35); }
}
@keyframes particleDrift1 {
  0% { opacity: 0.2; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-6px); }
  100% { opacity: 0.2; transform: translateY(0); }
}
@keyframes particleDrift2 {
  0% { opacity: 0.4; transform: translateY(0); }
  50% { opacity: 0.8; transform: translateY(-8px); }
  100% { opacity: 0.4; transform: translateY(0); }
}
@keyframes mistDrift {
  0%   { background-position: 0% 50%, 100% 0%, 50% 100%; }
  50%  { background-position: 100% 50%, 0% 100%, 50% 0%; }
  100% { background-position: 0% 50%, 100% 0%, 50% 100%; }
}
@keyframes btnGlow {
  0%, 100% { box-shadow: 0 0 16px rgba(157,122,255,0.15), 0 2px 8px rgba(0,0,0,0.3); }
  50%      { box-shadow: 0 0 24px rgba(157,122,255,0.3), 0 2px 12px rgba(0,0,0,0.3); }
}
@keyframes completedGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.15), inset 0 0 6px rgba(255,215,0,0.08); }
  50%      { box-shadow: 0 0 16px rgba(255,215,0,0.3), inset 0 0 10px rgba(255,215,0,0.15); }
}
@keyframes activeBreath {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(157,122,255,0.25), 0 0 40px rgba(157,122,255,0.12), 0 0 60px rgba(78,205,196,0.06); }
  50%      { transform: scale(1.06); box-shadow: 0 0 28px rgba(157,122,255,0.4), 0 0 56px rgba(157,122,255,0.2), 0 0 80px rgba(78,205,196,0.1); }
}
@keyframes activeRingPulse {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes lockedTease {
  0%, 100% { box-shadow: 0 0 6px rgba(157,122,255,0.08); border-color: rgba(157,122,255,0.2); }
  50%      { box-shadow: 0 0 18px rgba(157,122,255,0.2); border-color: rgba(157,122,255,0.45); }
}
@keyframes lockedTrophyTease {
  0%, 100% { box-shadow: 0 0 8px rgba(255,215,0,0.08); border-color: rgba(255,215,0,0.2); }
  50%      { box-shadow: 0 0 22px rgba(255,215,0,0.2); border-color: rgba(255,215,0,0.45); }
}
@keyframes trackShimmer {
  0%, 85% { transform: translateX(-120%); }
  100%    { transform: translateX(120%); }
}
@keyframes cardBreath {
  0%, 100% { box-shadow: 0 0 14px rgba(157,122,255,0.1); }
  50%      { box-shadow: 0 0 44px rgba(157,122,255,0.25); }
}
@keyframes barShimmer {
  0%, 75% { transform: translateX(-100%); }
  100%    { transform: translateX(200%); }
}
@keyframes doneGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(78,205,196,0.1); }
  50%      { box-shadow: 0 0 40px rgba(78,205,196,0.25); }
}
@keyframes celebrateBounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
  50%      { transform: translateY(-10px) scale(1.2); opacity: 1; }
}
@keyframes trophyShine {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.2); }
}
```

**Step 3: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS — no type errors from token additions

**Step 4: Commit**

```bash
git add apps/web/app/(onboarding)/_components/tokens.ts apps/web/app/(dashboard)/layout.tsx
git commit -m "feat(dashboard): add ROADMAP_TIERS tokens and redesign keyframes"
```

---

### Task 2: Extend QuestTask with roadmap metadata

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_utils/quest-templates.ts:6-22`
- Modify: `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts:14-43`

**Step 1: Add roadmap fields to QuestTask interface**

Open `apps/web/app/(dashboard)/home/_utils/quest-templates.ts`. Add 3 optional fields after line 21 (`goalIcon: string;`), before the closing `}`:

```typescript
  goalIcon: string;
  roadmapId?: string;
  roadmapTitle?: string;
  roadmapTier?: import('../../../../(onboarding)/_components/tokens').RoadmapTier;
```

**Step 2: Populate roadmap fields in serverTaskToQuestTask**

Open `apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts`. Find the `serverTaskToQuestTask` function (around line 14). It currently maps server task fields to `QuestTask`. Add the 3 new fields to the return object.

Find the return statement inside `serverTaskToQuestTask` and add after `goalIcon`:

```typescript
    goalIcon: goalIcon,
    roadmapId: roadmapId,
    roadmapTitle: roadmapTitle,
    roadmapTier: undefined, // Tier assignment computed in DailyQuests component
```

Note: The `serverTaskToQuestTask` function parameters need to accept `roadmapId` and `roadmapTitle`. Check the function signature and the call site in `serverQuestGroups` (around line 134-150). The grouping logic iterates over quests — we need to pass roadmap context through.

Look at the `serverQuestGroups` useMemo (lines 134-150). It groups quests by `skillDomain`. Each quest from the server has `task.milestone.roadmap` available. Add `roadmapId` and `roadmapTitle` when constructing `QuestTask`:

In the mapping inside `serverQuestGroups`, after `serverTaskToQuestTask(...)` is called, spread-assign the roadmap fields:

```typescript
const questTask = serverTaskToQuestTask(task, goalLabel, goalIcon);
questTask.roadmapId = task.milestone?.roadmap?.id;
questTask.roadmapTitle = task.milestone?.roadmap?.title;
```

**Step 3: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS — optional fields don't break existing consumers

**Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/home/_utils/quest-templates.ts apps/web/app/(dashboard)/home/_hooks/useQuestSystem.ts
git commit -m "feat(dashboard): extend QuestTask with roadmapId, roadmapTitle, roadmapTier"
```

---

### Task 3: Create ContinueQuestHero component

**Files:**
- Create: `apps/web/app/(dashboard)/home/_components/ContinueQuestHero.tsx`

**Step 1: Create ContinueQuestHero.tsx**

This is the "Zone 1" CTA hero widget. It picks the highest-priority next quest and renders a single prominent card with mystical scene effects.

```typescript
'use client';

import React, { useRef, useEffect } from 'react';
import { NeonIcon } from '../../../(onboarding)/_components/NeonIcon';
import { t, rarity as rarityTokens, ROADMAP_TIERS } from '../../../(onboarding)/_components/tokens';
import type { RoadmapTier } from '../../../(onboarding)/_components/tokens';
import { useI18nStore } from '@plan2skill/store';
import type { QuestTask } from '../_utils/quest-templates';

interface ContinueQuestHeroProps {
  /** The next quest to continue (highest priority) */
  nextQuest: QuestTask | null;
  /** Whether all daily quests are completed */
  allDone: boolean;
  /** Number of completed / total quests today */
  dailyCompleted: number;
  dailyTotal: number;
  /** Callback to open the quest modal */
  onStartQuest: (taskId: string) => void;
}

/** Icon map for quest types */
const typeIcon: Record<string, string> = {
  article: 'book',
  video: 'play',
  quiz: 'quiz',
  project: 'rocket',
  review: 'book',
  boss: 'crown',
};

export function ContinueQuestHero({
  nextQuest,
  allDone,
  dailyCompleted,
  dailyTotal,
  onStartQuest,
}: ContinueQuestHeroProps) {
  const tr = useI18nStore((s) => s.t);
  const prefersReduced = useRef(false);
  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // ── All-Done Celebration ──
  if (allDone && dailyTotal > 0) {
    return (
      <div style={{
        position: 'relative',
        padding: '32px 24px',
        borderRadius: 20,
        background: `radial-gradient(ellipse at 50% 30%, ${t.cyan}12 0%, ${t.bgCard} 70%)`,
        border: `1.5px solid ${t.cyan}25`,
        textAlign: 'center',
        overflow: 'hidden',
        marginBottom: 24,
        animation: prefersReduced.current ? 'none' : 'doneGlow 3s ease-in-out infinite',
      }}>
        <div style={{
          fontSize: 40,
          marginBottom: 12,
          animation: prefersReduced.current ? 'none' : 'celebrateBounce 2s ease-in-out infinite',
        }}>
          <NeonIcon type="trophy" size={40} color={t.gold} />
        </div>
        <div style={{
          fontFamily: t.display, fontSize: 20, fontWeight: 900,
          color: t.text, marginBottom: 6,
        }}>
          {tr('dashboard.all_done', 'All quests completed!')}
        </div>
        <div style={{
          fontFamily: t.body, fontSize: 14, color: t.textSecondary,
        }}>
          {tr('dashboard.all_done_sub', 'Amazing work today, hero! Come back tomorrow for new quests.')}
        </div>
        <div style={{
          fontFamily: t.mono, fontSize: 12, fontWeight: 700,
          color: t.cyan, marginTop: 12,
        }}>
          {dailyCompleted}/{dailyTotal} {tr('dashboard.quests_done', 'quests conquered')}
        </div>
      </div>
    );
  }

  // ── No quest available ──
  if (!nextQuest) {
    return null; // No CTA when there are no quests at all
  }

  const r = rarityTokens[nextQuest.rarity] ?? rarityTokens.common;
  const tier = nextQuest.roadmapTier ?? 'diamond';
  const tierStyle = ROADMAP_TIERS[tier];
  const icon = typeIcon[nextQuest.type] ?? 'scroll';

  return (
    <div
      style={{
        position: 'relative',
        padding: '24px 20px',
        borderRadius: 20,
        background: t.bgCard,
        border: '1.5px solid rgba(157,122,255,0.15)',
        overflow: 'hidden',
        marginBottom: 24,
        animation: prefersReduced.current ? 'none' : 'ctaAmbient 6s ease-in-out infinite',
      }}
    >
      {/* ── Scene layer: particles ── */}
      {!prefersReduced.current && (
        <>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            boxShadow: '18px 15px 0 0.5px rgba(157,122,255,0.4), 45px 35px 0 0.5px rgba(78,205,196,0.3), 80px 12px 0 0.5px rgba(255,215,0,0.3), 120px 40px 0 0.5px rgba(157,122,255,0.3), 160px 20px 0 0.5px rgba(78,205,196,0.4), 200px 45px 0 0.5px rgba(255,215,0,0.2), 35px 50px 0 0.5px rgba(157,122,255,0.3), 75px 55px 0 0.5px rgba(78,205,196,0.2), 140px 8px 0 0.5px rgba(255,215,0,0.3), 180px 52px 0 0.5px rgba(157,122,255,0.4)',
            animation: 'particleDrift1 9s ease-in-out infinite',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            boxShadow: '25px 8px 0 0.5px rgba(78,205,196,0.3), 60px 42px 0 0.5px rgba(157,122,255,0.3), 95px 18px 0 0.5px rgba(255,215,0,0.4), 130px 48px 0 0.5px rgba(78,205,196,0.2), 170px 30px 0 0.5px rgba(157,122,255,0.4), 210px 10px 0 0.5px rgba(255,215,0,0.3), 50px 28px 0 0.5px rgba(78,205,196,0.3), 110px 55px 0 0.5px rgba(157,122,255,0.2), 150px 5px 0 0.5px rgba(255,215,0,0.4), 190px 38px 0 0.5px rgba(78,205,196,0.3)',
            animation: 'particleDrift2 13s ease-in-out infinite',
          }} />
        </>
      )}

      {/* ── Scene layer: mystical fog ── */}
      {!prefersReduced.current && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(157,122,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(78,205,196,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,215,0,0.06) 0%, transparent 50%)',
          backgroundSize: '60% 60%, 50% 50%, 40% 40%',
          animation: 'mistDrift 16s ease-in-out infinite',
        }} />
      )}

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
        }}>
          <NeonIcon type="compass" size={16} color="violet" />
          <span style={{
            fontFamily: t.mono, fontSize: 10, fontWeight: 800,
            color: t.violet, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {tr('dashboard.next_quest', 'Next Quest')}
          </span>
        </div>

        {/* Quest info */}
        <div style={{
          fontFamily: t.display, fontSize: 18, fontWeight: 800,
          color: t.text, marginBottom: 6, lineHeight: 1.3,
        }}>
          {nextQuest.title}
        </div>

        <div style={{
          fontFamily: t.body, fontSize: 13, color: t.textSecondary,
          marginBottom: 14, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {nextQuest.desc}
        </div>

        {/* Tags row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          marginBottom: 16,
        }}>
          {/* Roadmap tier chip */}
          {nextQuest.roadmapTitle && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: t.mono, fontSize: 9, fontWeight: 800,
              padding: '3px 10px', borderRadius: 10,
              background: tierStyle.bg,
              color: tierStyle.text,
              boxShadow: tierStyle.shadow,
              textShadow: tierStyle.textShadow,
              textTransform: 'uppercase',
            }}>
              {nextQuest.roadmapTitle}
            </span>
          )}

          {/* Type + rarity */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: t.mono, fontSize: 9, fontWeight: 700,
            padding: '2px 8px', borderRadius: 8,
            color: r.color, background: `${r.color}12`,
            textTransform: 'uppercase',
          }}>
            <NeonIcon type={icon as any} size={10} color={r.color} />
            {nextQuest.type}
          </span>

          {/* Time estimate */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontFamily: t.body, fontSize: 11, color: t.textMuted,
          }}>
            <NeonIcon type="clock" size={11} color="muted" />
            {nextQuest.mins} min
          </span>

          {/* XP */}
          <span style={{
            fontFamily: t.mono, fontSize: 11, fontWeight: 800, color: t.violet,
          }}>
            +{nextQuest.xp} XP
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={() => onStartQuest(nextQuest.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 14,
            background: t.gradient,
            border: 'none', cursor: 'pointer',
            fontFamily: t.display, fontSize: 14, fontWeight: 800,
            color: '#fff', letterSpacing: '0.02em',
            animation: prefersReduced.current ? 'none' : 'btnGlow 4s ease-in-out infinite',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <NeonIcon type="swords" size={16} color="#fff" />
          {tr('dashboard.begin_quest', 'Begin Quest')}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/ContinueQuestHero.tsx
git commit -m "feat(dashboard): add ContinueQuestHero component with mystical scene effects"
```

---

### Task 4: Upgrade milestone visualization in ActiveQuests (QuestLines)

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx:226-339`

This is the core milestone path upgrade — larger nodes, opaque backgrounds, teasing locked states, progress line "flows into" active dot.

**Step 1: Replace milestone path rendering**

Open `apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx`.

Replace the entire milestone path section (lines 226-339) — from `{/* ── Horizontal milestone path ── */}` to the closing `</div>` of the milestone path container.

The new milestone path code:

```typescript
                {/* ── Horizontal milestone path (redesigned) ── */}
                <div style={{ position: 'relative', padding: '6px 0 32px', margin: '4px 0 0' }}>
                  {/* Background track line */}
                  <div style={{
                    position: 'absolute',
                    top: 28, left: 16, right: 16,
                    height: 4, borderRadius: 2,
                    background: 'rgba(37,37,48,0.8)',
                    zIndex: 0,
                  }} />
                  {/* Progress fill on track */}
                  <div style={{
                    position: 'absolute',
                    top: 26, left: 16, right: 16,
                    height: 6, borderRadius: 3,
                    overflow: 'hidden',
                    zIndex: 1,
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      background: isCompleted
                        ? `linear-gradient(90deg, ${t.gold}, ${t.cyan})`
                        : t.gradient,
                      transform: `scaleX(${(() => {
                        if (isCompleted) return 1;
                        // "flows into" active milestone: line reaches center of active dot
                        const totalNodes = rm.milestones.length;
                        if (totalNodes <= 1) return progress / 100;
                        const activeIdx = rm.milestones.findIndex((m) => m.status === 'active');
                        if (activeIdx < 0) return progress / 100;
                        // Calculate scaleX so line reaches the center of the active node
                        // Each node occupies 1/totalNodes of the track width
                        // Node center = (activeIdx + 0.5) / totalNodes
                        const nodeCenter = (activeIdx + 0.5) / totalNodes;
                        // Add partial progress within the active milestone
                        const msProgress = rm.milestones[activeIdx]?.progress ?? 0;
                        const nodeSpan = 1 / totalNodes;
                        return Math.min(nodeCenter + (msProgress / 100) * nodeSpan * 0.4, 1);
                      })()})`,
                      transformOrigin: 'left',
                      transition: 'transform 0.6s ease-out',
                      boxShadow: '0 0 12px rgba(157,122,255,0.3), 0 0 24px rgba(78,205,196,0.15)',
                      position: 'relative',
                    }}>
                      {/* Track shimmer */}
                      {!prefersReduced.current && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                          animation: 'trackShimmer 3s ease-in-out infinite',
                        }} />
                      )}
                    </div>
                  </div>

                  {/* Milestone icons on the line */}
                  <div style={{
                    position: 'relative', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '0 4px',
                    zIndex: 2,
                  }}>
                    {rm.milestones.map((ms, j) => {
                      const msCompleted = ms.status === 'completed';
                      const msActive = ms.status === 'active';
                      const isBoss = j === rm.milestones.length - 1;
                      const iconSize = isBoss ? 28 : 22;
                      const nodeSize = isBoss ? 54 : 44;

                      const iconColor = msCompleted
                        ? (isBoss ? t.gold : t.cyan)
                        : msActive
                          ? t.violet
                          : t.textMuted;

                      // Determine node styles based on state
                      const nodeBackground = msCompleted
                        ? (isBoss
                          ? `radial-gradient(circle at 50% 40%, #3D3118 0%, #252015 100%)`
                          : `radial-gradient(circle at 50% 40%, #3D3118 0%, #252015 100%)`)
                        : msActive
                          ? (isBoss
                            ? `radial-gradient(circle at 50% 40%, #3D3118 0%, #1A1815 100%)`
                            : `radial-gradient(circle at 40% 35%, #2E2548 0%, #1A1820 70%)`)
                          : '#15151C';

                      const nodeBorder = msCompleted
                        ? `2.5px solid rgba(255,215,0,0.7)`
                        : msActive
                          ? (isBoss ? `2.5px solid ${t.gold}` : `2.5px solid ${t.violet}`)
                          : (isBoss ? `2px dashed rgba(255,215,0,0.25)` : `1.5px dashed rgba(157,122,255,0.25)`);

                      const nodeBoxShadow = msCompleted
                        ? 'none' // completedGlow animation handles it
                        : msActive
                          ? `0 0 20px rgba(157,122,255,0.25), 0 0 40px rgba(157,122,255,0.12), 0 0 60px rgba(78,205,196,0.06)`
                          : 'none'; // lockedTease animation handles it

                      const nodeAnimation = msCompleted
                        ? (prefersReduced.current ? 'none' : 'completedGlow 3s ease-in-out infinite')
                        : msActive
                          ? (prefersReduced.current ? 'none' : 'activeBreath 2.5s ease-in-out infinite')
                          : (prefersReduced.current ? 'none' : (isBoss ? 'lockedTrophyTease 4s ease-in-out infinite' : 'lockedTease 4s ease-in-out infinite'));

                      return (
                        <div key={ms.id} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          flex: 1, minWidth: 0,
                        }}>
                          {/* Icon node */}
                          <div style={{
                            position: 'relative',
                            width: nodeSize, height: nodeSize,
                            borderRadius: '50%',
                            background: nodeBackground,
                            border: nodeBorder,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: nodeBoxShadow,
                            animation: nodeAnimation,
                            transition: 'all 0.3s ease',
                          }}>
                            {/* Active pulsing rings */}
                            {msActive && !prefersReduced.current && (
                              <>
                                <div style={{
                                  position: 'absolute', inset: -4,
                                  borderRadius: '50%',
                                  border: `1.5px solid ${isBoss ? t.gold : t.violet}`,
                                  animation: 'activeRingPulse 2.5s ease-out infinite',
                                  pointerEvents: 'none',
                                }} />
                                <div style={{
                                  position: 'absolute', inset: -4,
                                  borderRadius: '50%',
                                  border: `1px solid ${isBoss ? t.gold : t.violet}`,
                                  animation: 'activeRingPulse 2.5s ease-out 0.8s infinite',
                                  pointerEvents: 'none',
                                }} />
                              </>
                            )}
                            <NeonIcon
                              type={isBoss ? 'trophy' : 'medal'}
                              size={iconSize}
                              color={iconColor}
                            />
                            {/* Shine sweep on locked milestones */}
                            {!msCompleted && !msActive && !prefersReduced.current && (
                              <div style={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: '100%', height: '100%',
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 100%)',
                                  animation: `shineSweep ${5 + j * 0.7}s ease-in-out infinite`,
                                  animationDelay: `${j * 1.2}s`,
                                }} />
                              </div>
                            )}
                          </div>
                          {/* Milestone label */}
                          <span style={{
                            fontFamily: t.mono, fontSize: 8, fontWeight: 600,
                            color: msActive ? t.text : msCompleted ? t.textSecondary : t.textMuted,
                            textAlign: 'center',
                            marginTop: 6,
                            lineHeight: 1.2,
                            width: '100%',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            opacity: msActive || msCompleted ? 1 : 0.7,
                          }}>
                            {ms.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
```

**Step 2: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 3: Visual verification**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm dev`
Open `http://localhost:3000/home` and verify:
- Milestone dots are 44px (medals) / 54px (trophies)
- Backgrounds are opaque (no track line bleeding through)
- Completed dots have golden glow
- Active dots breathe and have pulsing rings
- Locked dots tease with purple/gold glow
- Progress line flows into active dot center
- Track shimmer animates smoothly

**Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx
git commit -m "feat(dashboard): upgrade milestone visualization with opaque dots, teasing locked states, flows-into progress line"
```

---

### Task 5: Add tier chips and completed section to DailyQuests

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/DailyQuests.tsx`

**Step 1: Import ROADMAP_TIERS**

Open `apps/web/app/(dashboard)/home/_components/DailyQuests.tsx`. At line 5, add `ROADMAP_TIERS` to the import:

```typescript
import { t, rarity, ROADMAP_TIERS } from '../../../(onboarding)/_components/tokens';
```

**Step 2: Add tier chip before rarity badge in tag row**

Find the tag row (around line 268). Before the rarity `<span>` (line 269), add the roadmap tier chip. The chip should only show if the task has `roadmapTitle`:

Insert before the existing rarity span:

```typescript
                            {/* Roadmap tier chip */}
                            {task.roadmapTitle && (() => {
                              const tier = task.roadmapTier ?? 'diamond';
                              const tierStyle = ROADMAP_TIERS[tier];
                              return (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  fontFamily: t.mono, fontSize: 8, fontWeight: 800,
                                  padding: '2px 8px', borderRadius: 8,
                                  background: done ? `${t.textMuted}10` : tierStyle.bg,
                                  color: done ? t.textMuted : tierStyle.text,
                                  boxShadow: done ? 'none' : tierStyle.shadow,
                                  textShadow: done ? 'none' : tierStyle.textShadow,
                                  textTransform: 'uppercase',
                                }}>
                                  {task.roadmapTitle}
                                </span>
                              );
                            })()}
```

**Step 3: Add completed quests collapsible section**

After the main quest list closing `</div>` (around line 314), add a collapsible "Completed" section. This requires adding state for the collapsed toggle.

Add state near the top of the component (after existing `useState` calls):

```typescript
const [showCompleted, setShowCompleted] = useState(false);
```

Then add the completed section after the quest list. Compute completed tasks from `questGroups` + `completedQuests` set:

```typescript
      {/* ── Completed Quests (collapsible) ── */}
      {(() => {
        const completedTasks = questGroups.flatMap((g) =>
          g.tasks.filter((task) => completedQuests.has(task.id))
        );
        if (completedTasks.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10,
                background: 'transparent', border: `1px solid ${t.border}`,
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${t.bgElevated}`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <NeonIcon type="check" size={12} color="cyan" />
              <span style={{
                fontFamily: t.display, fontSize: 12, fontWeight: 700,
                color: t.textSecondary, flex: 1,
              }}>
                {tr('dashboard.completed_today', 'Completed ({n})').replace('{n}', String(completedTasks.length))}
              </span>
              <span style={{
                fontFamily: t.mono, fontSize: 10, color: t.textMuted,
                transform: showCompleted ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}>
                ▼
              </span>
            </button>
            {showCompleted && (
              <div style={{
                marginTop: 8,
                animation: 'fadeUp 0.2s ease-out',
              }}>
                {completedTasks.map((task) => {
                  const r2 = rarity[task.rarity] ?? rarity.common;
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 12,
                      background: t.bgElevated, border: `1px solid ${t.border}`,
                      marginBottom: 4, opacity: 0.7,
                    }}>
                      <NeonIcon type="check" size={14} color="cyan" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: t.body, fontSize: 13, fontWeight: 500,
                          color: t.textMuted, textDecoration: 'line-through',
                        }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{
                            fontFamily: t.mono, fontSize: 9, fontWeight: 700,
                            padding: '1px 6px', borderRadius: 6,
                            color: t.textMuted, background: `${t.textMuted}10`,
                            textTransform: 'uppercase',
                          }}>
                            {r2.icon} {task.type}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontFamily: t.mono, fontSize: 11, fontWeight: 700,
                        color: t.textMuted,
                      }}>
                        {tr('quest.complete', 'Quest Complete!')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
```

**Step 4: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/DailyQuests.tsx
git commit -m "feat(dashboard): add 3D tier chips + completed quests collapsible section"
```

---

### Task 6: Wire ContinueQuestHero into page.tsx and reorder layout

**Files:**
- Modify: `apps/web/app/(dashboard)/home/page.tsx`

**Step 1: Add import for ContinueQuestHero**

Open `apps/web/app/(dashboard)/home/page.tsx`. Add import after line 17 (`import { DailyQuests } from './_components/DailyQuests';`):

```typescript
import { ContinueQuestHero } from './_components/ContinueQuestHero';
```

**Step 2: Insert ContinueQuestHero after StatsRow**

Find the `{/* Stats Row */}` section (line 524-534). After `<StatsRow ... />` and the `{/* Phase 5H: Attribute Widget */}` inline block (line 539), insert the ContinueQuestHero:

After line 539 (`</div>` closing attribute widget inline), add:

```typescript
      {/* Zone 1: Continue Quest Hero CTA */}
      {!isRoadmapGenerating && questGroups.length > 0 && (
        <ContinueQuestHero
          nextQuest={getNextQuest()}
          allDone={dailyCompleted >= dailyTotal && dailyTotal > 0}
          dailyCompleted={dailyCompleted}
          dailyTotal={dailyTotal}
          onStartQuest={setOpenQuestId}
        />
      )}
```

**Step 3: Verify `getNextQuest` exists in useDailyProgress**

The `getNextQuest` is already returned from `useDailyProgress` (line 352). It returns the next uncompleted `QuestTask | null`. If this function doesn't exist, we need to add it.

Check `useDailyProgress` — if `getNextQuest` is not exported, add a simple getter:

```typescript
const getNextQuest = useCallback((): QuestTask | null => {
  for (const [, task] of allTasks) {
    if (!completedQuests.has(task.id)) return task;
  }
  return null;
}, [allTasks, completedQuests]);
```

**Step 4: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 5: Visual verification**

Run: `pnpm dev` and check:
- ContinueQuestHero appears above DailyQuests
- Mystical particle/fog effects animate slowly
- Button opens quest modal on click
- All-done celebration shows when all quests completed
- WelcomeBack → StatsRow → CTA → DailyQuests → QuestLines order

**Step 6: Commit**

```bash
git add apps/web/app/(dashboard)/home/page.tsx
git commit -m "feat(dashboard): wire ContinueQuestHero into page layout"
```

---

### Task 7: Add sparkle particles to quest line cards

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx:151-167`

**Step 1: Add sparkle particle overlay to quest line card**

Find the quest line card `<button>` element (around line 153). Inside it, before the first child (`<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>`), add the sparkle particles:

```typescript
                {/* Sparkle particles */}
                {!prefersReduced.current && !isCompleted && !isGenerating && (
                  <div aria-hidden="true" style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    borderRadius: 16, overflow: 'hidden',
                  }}>
                    {[
                      { x: '15%', y: '20%', color: t.violet, delay: '0s' },
                      { x: '75%', y: '60%', color: t.cyan, delay: '1s' },
                      { x: '45%', y: '80%', color: t.gold, delay: '2s' },
                      { x: '85%', y: '15%', color: t.violet, delay: '0.5s' },
                    ].map((p, k) => (
                      <div key={k} style={{
                        position: 'absolute', left: p.x, top: p.y,
                        width: 3, height: 3, borderRadius: '50%',
                        background: p.color,
                        boxShadow: `0 0 6px ${p.color}`,
                        animation: `sparkleFloat 4s ease-in-out ${p.delay} infinite`,
                      }} />
                    ))}
                  </div>
                )}
```

Also add `position: 'relative'` and `overflow: 'hidden'` to the button style if not already present.

**Step 2: Add breathing glow to active cards**

Update the button's `boxShadow` to include breathing animation for active (non-completed, non-generating) cards:

In the button's style, add:
```typescript
animation: !isCompleted && !isGenerating && !prefersReduced.current
  ? `fadeUp 0.4s ease-out ${i * 0.1}s both, cardBreath 3s ease-in-out infinite`
  : `fadeUp 0.4s ease-out ${i * 0.1}s both`,
```

Note: Move the animation from the parent `<div>` (line 152) to the `<button>` itself, or keep both.

**Step 3: Verify typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/home/_components/ActiveQuests.tsx
git commit -m "feat(dashboard): add sparkle particles and breathing glow to quest line cards"
```

---

### Task 8: Add i18n keys to seed file

**Files:**
- Modify: `apps/api/prisma/seed-i18n-full.ts`

**Step 1: Add new translation keys**

Find the translations section in the seed file. Add the following keys with all 3 locales (en, uk, pl):

| Key | EN | UK | PL |
|-----|----|----|-----|
| `dashboard.next_quest` | Next Quest | Наступний квест | Następna misja |
| `dashboard.begin_quest` | Begin Quest | Розпочати квест | Rozpocznij misję |
| `dashboard.all_done` | All quests completed! | Всі квести виконано! | Wszystkie misje ukończone! |
| `dashboard.all_done_sub` | Amazing work today, hero! Come back tomorrow for new quests. | Чудова робота сьогодні, герою! Повертайся завтра за новими квестами. | Świetna robota, bohaterze! Wróć jutro po nowe misje. |
| `dashboard.quests_done` | quests conquered | квестів пройдено | misji ukończonych |
| `dashboard.completed_today` | Completed ({n}) | Виконано ({n}) | Ukończone ({n}) |
| `dashboard.quest_lines` | Quest Lines | Лінії квестів | Linie misji |

Some of these may already exist — check before adding duplicates.

**Step 2: Commit**

```bash
git add apps/api/prisma/seed-i18n-full.ts
git commit -m "feat(i18n): add dashboard redesign translation keys (en, uk, pl)"
```

---

### Task 9: Final integration testing

**Step 1: Run full typecheck**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm typecheck`
Expected: PASS — zero errors

**Step 2: Run lint**

Run: `cd C:/Users/Admin/Downloads/Roadmapper/plan2skill && pnpm lint`
Expected: PASS or only pre-existing warnings

**Step 3: Visual smoke test**

Run: `pnpm dev` and verify the full dashboard flow:

1. **Page load** — skeleton → hydration → content appears
2. **ContinueQuestHero** — shows next quest with particles/fog/glow
3. **CTA click** — opens QuestJourneyModal
4. **Complete quest** — CTA updates to next quest, XP float, sound
5. **Complete all** — CTA switches to all-done celebration
6. **DailyQuests** — tier chips visible on quest cards (if roadmap data available)
7. **Completed section** — collapsible, shows completed quests with strikethrough
8. **QuestLines** — milestone dots are 44/54px, opaque backgrounds
9. **Progress line** — flows into active milestone, doesn't overshoot
10. **Locked milestones** — visible with teasing purple/gold glow
11. **prefers-reduced-motion** — all animations disabled gracefully

**Step 4: Commit final state**

```bash
git add -A
git commit -m "feat(dashboard): Phase 1 dashboard redesign — CTA hero, tier chips, milestone viz, completed section"
```

---

## Dependency Graph

```
Task 1 (tokens + keyframes) ──┬──> Task 3 (ContinueQuestHero)
                               ├──> Task 4 (milestone viz)
                               ├──> Task 5 (tier chips)
                               └──> Task 7 (sparkle particles)

Task 2 (QuestTask type) ──────┬──> Task 3 (ContinueQuestHero)
                               └──> Task 5 (tier chips)

Task 3 (ContinueQuestHero) ───┬──> Task 6 (wire into page.tsx)
                               │
Task 4 (milestone viz) ────────┤
Task 5 (tier chips + completed)┤
Task 7 (sparkle particles) ────┤
Task 8 (i18n) ─────────────────┘──> Task 9 (integration test)
```

**Critical path:** Task 1 → Task 2 → Task 3 → Task 6 → Task 9

**Parallelizable:** Tasks 3, 4, 5, 7 can run in parallel after Tasks 1+2 complete. Task 8 is independent.

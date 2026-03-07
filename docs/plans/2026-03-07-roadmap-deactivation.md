# Roadmap Deactivation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to archive/reactivate roadmaps and view them with full quest history in a History tab on the Quest Map page.

**Architecture:** Use the existing `'archived'` RoadmapStatus enum value. Add `archivedAt` timestamp to Prisma schema. Backend archive/reactivate service methods with tier limit checks. Frontend: Active/History tabs on `/roadmap`, read-only mode on `/roadmap/[id]` for archived roadmaps, optimistic Zustand store actions.

**Tech Stack:** NestJS + Prisma (schema migration), tRPC (2 new procedures), Zustand (2 new store actions), Next.js 14 inline styles (tabs, banner, read-only mode), i18n seed (10 keys in en/uk/pl).

---

### Task 1: Schema — Add archivedAt field + migrate

**Files:**
- Modify: `apps/api/prisma/schema.prisma:212`
- Modify: `packages/types/src/roadmap.ts:5-19`

**Step 1: Add archivedAt to Prisma schema**

In `apps/api/prisma/schema.prisma`, inside the `Roadmap` model, add after `lastAccessedAt DateTime?` (line 212):

```prisma
  archivedAt       DateTime?
```

**Step 2: Add archivedAt to TypeScript interface**

In `packages/types/src/roadmap.ts`, add after `progress: number; // 0-100` (line 14):

```typescript
  archivedAt?: string | null;
```

**Step 3: Run migration + regenerate Prisma client**

Run:
```bash
cd apps/api && npx prisma migrate dev --name add-roadmap-archived-at
```

Expected: migration succeeds, adds nullable `archivedAt` column.

Then:
```bash
npx prisma generate
```

**Step 4: Typecheck**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

**Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/ packages/types/src/roadmap.ts
git commit -m "feat(schema): add archivedAt to Roadmap model"
```

---

### Task 2: Backend — archive + reactivate service methods

**Files:**
- Modify: `apps/api/src/roadmap/roadmap.service.ts:506`

**Step 1: Add archiveRoadmap method**

In `apps/api/src/roadmap/roadmap.service.ts`, add after `resumeRoadmap` (after line 506, before `getTodaysTasks`):

```typescript
  async archiveRoadmap(userId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, status: { in: ['active', 'paused'] } },
    });
    if (!roadmap) throw new NotFoundException('Active or paused quest line not found');
    return this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'archived', archivedAt: new Date() },
    });
  }
```

**Step 2: Add reactivateRoadmap method**

Add right after `archiveRoadmap`:

```typescript
  async reactivateRoadmap(userId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId, status: 'archived' },
    });
    if (!roadmap) throw new NotFoundException('Archived quest line not found');

    // Check tier limit before reactivating
    const gate = await this.validateRoadmapLimit(userId);
    if (!gate.allowed) {
      throw new BadRequestException(
        `Tier limit reached (${gate.current}/${gate.limit}). Upgrade to reactivate.`,
      );
    }

    return this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'paused', archivedAt: null },
    });
  }
```

**Step 3: Add BadRequestException import if missing**

At top of file, ensure:
```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
```

**Step 4: Typecheck**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

**Step 5: Commit**

```bash
git add apps/api/src/roadmap/roadmap.service.ts
git commit -m "feat(api): add archiveRoadmap + reactivateRoadmap service methods"
```

---

### Task 3: tRPC — archive + reactivate procedures

**Files:**
- Modify: `apps/api/src/trpc/trpc.router.ts:193`

**Step 1: Add archive and reactivate procedures**

In `apps/api/src/trpc/trpc.router.ts`, inside `roadmapRouter`, add after `resume` (after line 193, before `checkLimit`):

```typescript
      archive: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
          return this.roadmapService.archiveRoadmap(ctx.userId, input.roadmapId);
        }),
      reactivate: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
          return this.roadmapService.reactivateRoadmap(ctx.userId, input.roadmapId);
        }),
```

**Step 2: Typecheck both API and Web**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors (tRPC types auto-infer)

**Step 3: Commit**

```bash
git add apps/api/src/trpc/trpc.router.ts
git commit -m "feat(api): add roadmap.archive + roadmap.reactivate tRPC procedures"
```

---

### Task 4: Zustand store — archive + reactivate actions

**Files:**
- Modify: `packages/store/src/roadmap.store.ts:22-59`

**Step 1: Add interface declarations**

In `packages/store/src/roadmap.store.ts`, add after `resumeRoadmap: (roadmapId: string) => void;` (line 22):

```typescript
  archiveRoadmap: (roadmapId: string) => void;
  reactivateRoadmap: (roadmapId: string) => void;
```

**Step 2: Add implementations**

After `resumeRoadmap` implementation (after line 58, before `updateRoadmap`):

```typescript
  archiveRoadmap: (roadmapId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? { ...r, status: 'archived' as RoadmapStatus } : r,
      ),
    })),
  reactivateRoadmap: (roadmapId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? { ...r, status: 'paused' as RoadmapStatus } : r,
      ),
    })),
```

**Step 3: Re-export from store barrel**

Check `packages/store/src/index.ts` — `useRoadmapStore` should already be exported. No change needed.

**Step 4: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

**Step 5: Commit**

```bash
git add packages/store/src/roadmap.store.ts
git commit -m "feat(store): add archiveRoadmap + reactivateRoadmap optimistic actions"
```

---

### Task 5: QuestLineCard — archive action for active/paused + reactivate for archived

**Files:**
- Modify: `apps/web/app/(dashboard)/roadmap/_components/QuestLineCard.tsx:27-101`

**Step 1: Update QuestLineAction type**

At line 27-30, change:

```typescript
export interface QuestLineAction {
  type: 'adjust' | 'pause' | 'resume' | 'archive' | 'reactivate';
  roadmapId: string;
}
```

**Step 2: Add archive action to active/paused menus**

At line 86-101, replace the entire menu building block with:

```typescript
  // Build context menu items based on status
  const menuItems: { label: string; icon: NeonIconType; color: string; action: QuestLineAction['type'] }[] = [];
  if (roadmap.status === 'active') {
    menuItems.push(
      { label: 'Adjust Quest Line', icon: 'sparkle', color: t.violet, action: 'adjust' },
      { label: 'Pause Quest Line', icon: 'shield', color: '#FBBF24', action: 'pause' },
      { label: 'Archive Quest Line', icon: 'book', color: t.textMuted, action: 'archive' },
    );
  }
  if (roadmap.status === 'paused') {
    menuItems.push(
      { label: 'Resume Quest Line', icon: 'lightning', color: t.cyan, action: 'resume' },
      { label: 'Archive Quest Line', icon: 'book', color: t.textMuted, action: 'archive' },
    );
  }
  if (roadmap.status === 'archived') {
    menuItems.push(
      { label: 'Reactivate Quest Line', icon: 'lightning', color: t.cyan, action: 'reactivate' },
    );
  }
```

Note: remove old `completed` → `archive` block (it was a placeholder, completed roadmaps stay completed).

**Step 3: Add archived state message**

After the paused state message block (after line 292, before `</button>`), add:

```typescript
        {/* Archived state message */}
        {roadmap.status === 'archived' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            background: `${t.textMuted}08`,
          }}>
            <NeonIcon type="book" size={14} color={t.textMuted} />
            <span style={{
              fontFamily: t.body, fontSize: 12, fontWeight: 600,
              color: t.textMuted,
            }}>
              Archived — view history or reactivate
            </span>
          </div>
        )}
```

**Step 4: Reduce opacity for archived cards**

At line 121, update opacity:
```typescript
          opacity: isPaused ? 0.75 : roadmap.status === 'archived' ? 0.6 : 1,
```

**Step 5: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add "apps/web/app/(dashboard)/roadmap/_components/QuestLineCard.tsx"
git commit -m "feat(ui): archive/reactivate actions in QuestLineCard context menu"
```

---

### Task 6: Quest Map page — Active/History tabs + archive/reactivate handler

**Files:**
- Modify: `apps/web/app/(dashboard)/roadmap/page.tsx:90-212`

**Step 1: Add store selectors + mutations**

After existing store selectors (line 92), add:

```typescript
  const storeArchive = useRoadmapStore((s) => s.archiveRoadmap);
  const storeReactivate = useRoadmapStore((s) => s.reactivateRoadmap);

  const archiveMutation = trpc.roadmap.archive.useMutation();
  const reactivateMutation = trpc.roadmap.reactivate.useMutation();
```

**Step 2: Add tab state**

After `const [hoveredCard, setHoveredCard]` (line 104), add:

```typescript
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
```

**Step 3: Filter roadmaps by tab**

Replace the `roadmaps` useMemo (lines 108-113) with:

```typescript
  const allRoadmaps = useMemo<Roadmap[]>(() => {
    if (serverRoadmaps.length > 0) return serverRoadmaps;
    if (!selectedGoals.length) return [];
    const weeks = aiEstimateWeeks || 12;
    return selectedGoals.map((g) => buildMockRoadmap(g.label, g.id, weeks, dailyMinutes));
  }, [serverRoadmaps, selectedGoals, dailyMinutes, aiEstimateWeeks]);

  const roadmaps = useMemo<Roadmap[]>(() => {
    if (activeTab === 'active') {
      return allRoadmaps.filter((r) => ['active', 'paused', 'generating'].includes(r.status));
    }
    return allRoadmaps.filter((r) => ['archived', 'completed'].includes(r.status));
  }, [allRoadmaps, activeTab]);
```

Also update `activeCount` to use `allRoadmaps`:

```typescript
  const activeCount = allRoadmaps.filter(
    (r) => !r.id.startsWith('mock-') && (r.status === 'active' || r.status === 'generating'),
  ).length;
```

**Step 4: Add archive/reactivate to handleAction**

In `handleAction` (lines 125-159), add two new cases before the closing `}`:

```typescript
      case 'archive':
        storeArchive(action.roadmapId);
        archiveMutation.mutate(
          { roadmapId: action.roadmapId },
          {
            onError: (err) => {
              console.warn('[QuestMap] Archive sync failed:', err.message);
              storeResume(action.roadmapId); // Rollback to previous state
            },
          },
        );
        break;
      case 'reactivate':
        storeReactivate(action.roadmapId);
        reactivateMutation.mutate(
          { roadmapId: action.roadmapId },
          {
            onError: (err) => {
              console.warn('[QuestMap] Reactivate failed:', err.message);
              storeArchive(action.roadmapId); // Rollback
              if (err.message.includes('Tier limit')) {
                setShowTierModal(true);
              }
            },
          },
        );
        break;
```

**Step 5: Add tab bar UI**

After the subtitle `<p>` (after line 186, before the Card Grid), add:

```typescript
      {/* ─── Tab Bar ─── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        borderBottom: `1px solid ${t.border}`,
        paddingBottom: 0,
      }}>
        {(['active', 'history'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const count = tab === 'active'
            ? allRoadmaps.filter((r) => ['active', 'paused', 'generating'].includes(r.status)).length
            : allRoadmaps.filter((r) => ['archived', 'completed'].includes(r.status)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                fontFamily: t.display, fontSize: 13, fontWeight: isSelected ? 700 : 500,
                color: isSelected ? t.violet : t.textMuted,
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isSelected ? t.violet : 'transparent'}`,
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                marginBottom: -1,
              }}
            >
              {tab === 'active' ? tr('roadmap.tab_active', 'Active') : tr('roadmap.tab_history', 'History')}
              {count > 0 && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px', borderRadius: 8,
                  fontFamily: t.mono, fontSize: 10, fontWeight: 700,
                  background: isSelected ? `${t.violet}15` : `${t.textMuted}15`,
                  color: isSelected ? t.violet : t.textMuted,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
```

**Step 6: Hide "Add Quest Line" button on History tab**

Wrap the existing "+Add Quest Line" button (around line 215) with a condition:

```typescript
          {/* +Add Quest Line — only on Active tab */}
          {activeTab === 'active' && (
            <button ... >
              ...existing button code...
            </button>
          )}
```

**Step 7: Add empty state for History tab**

After the grid, before closing, add:

```typescript
      {/* Empty state for History tab */}
      {activeTab === 'history' && roadmaps.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, padding: '48px 0',
        }}>
          <NeonIcon type="book" size={32} color={t.textMuted} />
          <p style={{
            fontFamily: t.body, fontSize: 14, color: t.textMuted, textAlign: 'center',
          }}>
            {tr('roadmap.history_empty', 'No archived or completed quest lines yet')}
          </p>
        </div>
      )}
```

**Step 8: Update handleAction dependencies**

Add `storeArchive`, `storeReactivate`, `archiveMutation`, `reactivateMutation` to the `useCallback` dependency array.

**Step 9: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

**Step 10: Commit**

```bash
git add "apps/web/app/(dashboard)/roadmap/page.tsx"
git commit -m "feat(ui): Active/History tabs + archive/reactivate on Quest Map page"
```

---

### Task 7: Roadmap detail page — read-only mode + archived banner

**Files:**
- Modify: `apps/web/app/(dashboard)/roadmap/[id]/page.tsx:112-345`

**Step 1: Add store selectors + mutations for archive/reactivate**

After existing pause/resume selectors (line 114-116), add:

```typescript
  const storeArchive = useRoadmapStore((s) => s.archiveRoadmap);
  const storeReactivate = useRoadmapStore((s) => s.reactivateRoadmap);
  const archiveMutation = trpc.roadmap.archive.useMutation();
  const reactivateMutation = trpc.roadmap.reactivate.useMutation();
  const [showTierModal, setShowTierModal] = useState(false);
```

**Step 2: Add handleReactivate callback**

After `handleResume` (after line 130):

```typescript
  const handleReactivate = useCallback(() => {
    storeReactivate(roadmapId);
    reactivateMutation.mutate({ roadmapId }, {
      onError: (err) => {
        storeArchive(roadmapId);
        if (err.message.includes('Tier limit')) {
          setShowTierModal(true);
        }
      },
    });
  }, [roadmapId, storeArchive, storeReactivate, reactivateMutation]);
```

**Step 3: Add archived banner**

After the paused banner (after line 345), add:

```typescript
      {/* Archived banner */}
      {roadmap.status === 'archived' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '10px 16px', borderRadius: 12, marginBottom: 16,
          background: `${t.textMuted}08`, border: `1px solid ${t.textMuted}20`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NeonIcon type="book" size={16} color={t.textMuted} />
            <span style={{
              fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.textMuted,
            }}>
              {tr('roadmap.archived_banner', 'This Quest Line is archived')}
            </span>
          </div>
          <button
            onClick={handleReactivate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: `${t.cyan}10`, border: `1px solid ${t.cyan}25`,
              cursor: 'pointer', fontFamily: t.display, fontSize: 12,
              fontWeight: 700, color: t.cyan,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${t.cyan}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${t.cyan}10`; }}
          >
            <NeonIcon type="lightning" size={12} color={t.cyan} />
            {tr('roadmap.reactivate', 'Reactivate')}
          </button>
        </div>
      )}
```

**Step 4: Update action bar to include archived**

At line 272, change the condition from:

```typescript
      {(roadmap.status === 'active' || roadmap.status === 'paused') && (
```

to keep it the same — the action bar is already hidden for non-active/paused statuses. Archived roadmaps show only the banner (Step 3), no action buttons. No change needed here.

**Step 5: Add RoadmapTierModal for reactivation failure**

At the end of the component's return, before the closing `</div>`, add:

```typescript
      {showTierModal && (
        <RoadmapTierModal
          currentTier={subscriptionTier}
          onClose={() => setShowTierModal(false)}
        />
      )}
```

Make sure `RoadmapTierModal` is imported (check if it's already imported in the file). If not, add:

```typescript
import { RoadmapTierModal } from '../_components/RoadmapTierModal';
```

Also import `subscriptionTier`:
```typescript
const subscriptionTier = useProgressionStore((s) => s.subscriptionTier);
```

**Step 6: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

**Step 7: Commit**

```bash
git add "apps/web/app/(dashboard)/roadmap/[id]/page.tsx"
git commit -m "feat(ui): archived banner + reactivate button on roadmap detail page"
```

---

### Task 8: Dashboard RoadmapCards — filter archived from tier sort

**Files:**
- Modify: `apps/web/app/(dashboard)/home/_components/RoadmapCards.tsx`

**Step 1: Filter archived/completed roadmaps**

Find the `roadmaps` useMemo that builds the display list. Add a filter to exclude archived:

```typescript
const displayRoadmaps = useMemo<Roadmap[]>(() => {
  return roadmaps.filter((r) => !['archived', 'completed'].includes(r.status));
}, [roadmaps]);
```

Then use `displayRoadmaps` instead of `roadmaps` in the render.

**Step 2: Typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add "apps/web/app/(dashboard)/home/_components/RoadmapCards.tsx"
git commit -m "feat(ui): filter archived roadmaps from dashboard RoadmapCards"
```

---

### Task 9: i18n keys — 10 new translation entries

**Files:**
- Modify: `apps/api/prisma/seed-i18n-full.ts`

**Step 1: Add roadmap archive/history translations**

Find the roadmap section in `seed-i18n-full.ts` (search for `roadmap` or `questmap` keys). Add the following entries:

```typescript
  // ── Roadmap archive/history ──
  { entityId: 'roadmap.tab_active', en: 'Active', uk: 'Активні', pl: 'Aktywne' },
  { entityId: 'roadmap.tab_history', en: 'History', uk: 'Історія', pl: 'Historia' },
  { entityId: 'roadmap.archive_confirm_title', en: 'Deactivate Quest Line?', uk: 'Деактивувати квест-лінію?', pl: 'Dezaktywować linię questów?' },
  { entityId: 'roadmap.archive_confirm_body', en: 'You can restore it from History. All progress is saved.', uk: 'Ви можете відновити її з Історії. Весь прогрес збережено.', pl: 'Możesz przywrócić ją z Historii. Cały postęp jest zapisany.' },
  { entityId: 'roadmap.archived_banner', en: 'This Quest Line is archived', uk: 'Ця квест-лінія архівована', pl: 'Ta linia questów jest zarchiwizowana' },
  { entityId: 'roadmap.reactivate', en: 'Reactivate', uk: 'Відновити', pl: 'Przywróć' },
  { entityId: 'roadmap.reactivate_tier_blocked', en: 'Upgrade your tier to reactivate more quest lines', uk: 'Оновіть тір, щоб відновити більше квест-ліній', pl: 'Ulepsz swój poziom, aby przywrócić więcej linii questów' },
  { entityId: 'roadmap.quest_history', en: 'Quest History', uk: 'Історія квестів', pl: 'Historia questów' },
  { entityId: 'roadmap.completed_on', en: 'Completed on', uk: 'Завершено', pl: 'Ukończono' },
  { entityId: 'roadmap.xp_earned', en: 'XP earned', uk: 'Отримано XP', pl: 'Zdobyte XP' },
  { entityId: 'roadmap.history_empty', en: 'No archived or completed quest lines yet', uk: 'Ще немає архівованих або завершених квест-ліній', pl: 'Brak zarchiwizowanych ani ukończonych linii questów' },
```

**Step 2: Commit**

```bash
git add apps/api/prisma/seed-i18n-full.ts
git commit -m "feat(i18n): add roadmap archive/history translation keys (en/uk/pl)"
```

---

### Task 10: Integration typecheck + acceptance

**Step 1: Full typecheck — API**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errors

**Step 2: Full typecheck — Web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Verify quest.service.ts filters correctly**

Open `apps/api/src/quest/quest.service.ts` and confirm the `getDailyQuests` method filters by `status: 'active'` — archived roadmaps should generate zero quests. No code change needed, just verification.

**Step 4: Verify progression stats are unaffected**

Open `apps/api/src/progression/progression.service.ts` and confirm XP aggregation doesn't filter by roadmap status. No code change needed.

**Step 5: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: integration fixes for roadmap deactivation"
```

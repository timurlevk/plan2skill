# Dashboard UX Backlog

**Status:** BACKLOG — items planned but not yet scheduled for implementation
**Last updated:** 2026-03-02

---

## BL-001: Dynamic Welcome Greeting — Context-Aware First Impression

**Priority:** P1
**Affects:** `WelcomeBack.tsx`, `home/page.tsx`
**UX Rules:** UX-R100 (door-to-quest), UX-R102 (return flow), UX-R103 (no guilt), UX-R105 (endowed progress), UX-R141 (positive framing)

### Problem

Current `WelcomeBack` component uses a single dimension — **days since last activity** — to determine greeting text. This produces incorrect messaging for two scenarios:

1. **First visit after onboarding** — User completes onboarding, lands on dashboard for the first time. `lastActivityDate = null` → `daysAbsent = 999` → shows "Welcome back, Hero!" with warm-up card and bonus badge. But user isn't "back" — they're **new**. Should celebrate first arrival instead.

2. **Active daily user** — Returns same day, sees nothing (correct). But a user who was active yesterday (1 day) gets "Ready for more?" which is okay. No issue here, but edge case: user who logs in twice the same day after completing all quests shouldn't see warm-up card (already done).

### Current Logic (single dimension)

```
days = 0     → null (no banner)
days = 1-3   → "Ready for more, {name}?"
days = 4-7   → "We missed you, {name}!" + warm-up card
days = 7-30  → "Let's refresh, {name}!" + warm-up card + 2x XP badge
days = 30+   → "Welcome back, {name}!" + warm-up card + 2x XP badge + refresh goals
days = 999   → same as 30+ (lastActivityDate = null)
```

### Proposed Logic (two dimensions: user state × absence)

| User State | Condition | Greeting | CTA | Warm-up Card |
|------------|-----------|----------|-----|-------------|
| **First visit** | `onboardingCompletedAt` exists AND `lastActivityDate === null` | "Your adventure begins, {name}!" | "Your first quest awaits!" | Yes — first quest (easiest), no bonus badge |
| **Active** | `days = 0` | null (no banner) | — | — |
| **Recent** | `days = 1-3` | "Ready for more, {name}?" | "Your quests await, hero!" | No |
| **Returning** | `days = 4-7` | "We missed you, {name}!" | "Pick up where you left off" | Yes — auto-select easiest uncompleted |
| **Long absence** | `days = 7-30` | "Let's refresh, {name}!" | "Start with something light" | Yes + 2x XP bonus badge |
| **Very long absence** | `days = 30+` | "Welcome back, {name}!" | "Great to see you!" | Yes + bonus badge + "Refresh goals?" |

### Key Differences from Current

1. **New `isFirstVisit` flag** — derived from `onboardingCompletedAt !== null && lastActivityDate === null`
2. **First visit gets unique celebration** — "Your adventure begins!" with confetti/sparkle, NOT "Welcome back"
3. **First visit warm-up uses different copy** — "Your first quest awaits!" (endowed progress, UX-R105)
4. **Bonus badge only for returning users** — first visit doesn't show "2x XP" (no comparison baseline)

### Data Needed

- `onboardingCompletedAt` — already in `useOnboardingV2Store` (or `forgeComplete` from v1)
- `lastActivityDate` — already in `useProgressionStore`
- No new backend data needed — purely client-side derivation

### Implementation Notes

- Modify `getWelcomeConfig()` in `WelcomeBack.tsx` to accept `isFirstVisit: boolean`
- Add `isFirstVisit` computation in `home/page.tsx`
- Consider: should first visit set `lastActivityDate` immediately (so refresh doesn't show first-visit again)? **Yes** — `completeOnboarding()` or first dashboard render should set `lastActivityDate = now()`
- RPG vocabulary: "adventure begins" > "welcome back" for new users
- Animation: first visit could use `celebratePop` (Macro tier, interruptible)

### Acceptance Criteria

- [ ] New user after onboarding sees "Your adventure begins, {name}!" (not "Welcome back")
- [ ] First visit shows warm-up card with first quest, no bonus badge
- [ ] `lastActivityDate` is set on first dashboard render (prevents repeat first-visit on refresh)
- [ ] Returning user after 7 days still sees "Let's refresh" + bonus badge (no regression)
- [ ] Active same-day user sees no banner (no regression)
- [ ] All strings use RPG vocabulary
- [ ] Positive framing only (UX-R141)

---

## BL-002: Weekly League — Compact Sidebar Widget

**Priority:** P2
**Affects:** `(dashboard)/layout.tsx` sidebar
**UX Rules:** UX-R162 (opt-in social), UX-R011 (DW sidebar / MW bottom tab)

### Problem

Weekly League widget is currently in main content area and takes too much space. Should be compact and moved to left sidebar, positioned right after user name.

### Requirements

- Compact card (not full-width)
- Position: left sidebar, after character name/avatar
- Pinned to bottom of sidebar
- Content: rank badge (Bronze/Silver/Gold/Diamond), position (#N / 30), promote/demote rules
- "Join Weekly League" CTA for opt-in (social = opt-in only, UX-R162)
- Responsive: on mobile, moves to profile sheet or collapses

### Status

Waiting for Phase 6 (Social & Competitive) architecture decisions.

---

## BL-003: QuestCardModal — Two-Column Desktop Layout

**Priority:** P1
**Affects:** `QuestCardModal.tsx`
**UX Rules:** UX-R011 (DW sidebar layout), UX-R120 (information density), UX-R153 (44px touch targets)

### Problem

Current `QuestCardModal` is a narrow single-column card (`maxWidth: 440px`). All content — description, objectives, AI Tip, Fun Fact, Knowledge Check — stacks vertically in collapsible accordions. On desktop this means:

1. **Wasted horizontal space** — 440px on a 1440px+ screen
2. **Hidden content** — AI Tip, Fun Fact, Knowledge Check are collapsed by default → users miss learning value
3. **Too many clicks** — user must expand each section individually
4. **No visual hierarchy** — learning material and interactive elements are mixed in one scroll

### Current Layout (single column, 440px)

```
┌──────────────────────────────┐
│ Header (goal, title, badges) │
├──────────────────────────────┤
│ [Character] Description      │  ← scrollable body
│                              │
│ Quest Objectives             │
│  ○ Objective 1               │
│  ○ Objective 2               │
│  ○ Objective 3               │
│                              │
│ ▸ AI Tip         [💎 1]     │  ← collapsed
│ ▸ Fun Fact                   │  ← collapsed
│ ▸ Knowledge Check [💎 1]    │  ← collapsed
├──────────────────────────────┤
│ Quest Bounty: +15 XP        │
│ [Complete Quest]             │
│ Not now                      │
└──────────────────────────────┘
```

### Proposed Layout (two-column desktop, responsive)

**Desktop (≥ 768px):** `maxWidth: 820px`, two columns

```
┌──────────────────────────────────────────────────────────────────┐
│ Header (goal label, quest title, badges: type · rarity · tier)  │
├─────────────────────────────┬────────────────────────────────────┤
│                             │                                    │
│  LEFT: Learning Material    │  RIGHT: Interactive                │
│                             │                                    │
│  [Character] Description    │  ⚡ Knowledge Check               │
│                             │  ┌────────────────────────────┐   │
│  Quest Objectives           │  │ Question text...            │   │
│   ○ Objective 1             │  │                             │   │
│   ○ Objective 2             │  │  (A) Option 1               │   │
│   ○ Objective 3             │  │  (B) Option 2               │   │
│                             │  │  (C) Option 3               │   │
│                             │  └────────────────────────────┘   │
│                             │                                    │
│                             │  💡 AI Tip                        │
│                             │  "Start by reading the intro..."  │
│                             │                                    │
│                             │  🤓 Fun Fact                      │
│                             │  "Did you know that..."           │
│                             │                                    │
├─────────────────────────────┴────────────────────────────────────┤
│ Quest Bounty: +15 XP                       [Complete Quest]      │
│                                             Not now              │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile (< 768px):** Keep current single-column layout (440px), but with content changes:
- Knowledge Check **expanded by default** (not collapsed)
- AI Tip and Fun Fact remain collapsible

### Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Split at 768px** breakpoint | Standard tablet/desktop threshold |
| 2 | **Left = passive content** (description, objectives) | Natural reading order — understand the quest first |
| 3 | **Right = interactive content** (knowledge check, tips) | Action-oriented — engage after reading |
| 4 | **Knowledge Check expanded by default** on desktop | Primary learning interaction, shouldn't be hidden |
| 5 | **AI Tip & Fun Fact visible** (not collapsed) on desktop | Enough horizontal space, no reason to hide |
| 6 | **Footer spans full width** | CTA button stays prominent, consistent with current |
| 7 | **Header spans full width** | Title + badges stay at top, consistent visual anchor |
| 8 | **Left column scrollable, right sticky** | Learning material may be long; interactive panel stays visible |

### Implementation Notes

**Responsive detection:**
```typescript
// useMediaQuery or simple window.innerWidth check
const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
```

**Layout structure (desktop):**
```typescript
// Desktop: two-column flex row
<div style={{
  display: 'flex',
  flexDirection: isDesktop ? 'row' : 'column',
  maxWidth: isDesktop ? 820 : 440,
}}>
  {/* Left: learning material */}
  <div style={{
    flex: isDesktop ? '1 1 55%' : '1 1 100%',
    overflowY: 'auto',
    borderRight: isDesktop ? `1px solid ${t.border}` : 'none',
  }}>
    {/* Character + description */}
    {/* Quest objectives */}
  </div>

  {/* Right: interactive */}
  <div style={{
    flex: isDesktop ? '1 1 45%' : '1 1 100%',
    position: isDesktop ? 'sticky' : 'static',
    top: 0,
    overflowY: 'auto',
  }}>
    {/* Knowledge Check (expanded by default on desktop) */}
    {/* AI Tip (visible, not collapsed on desktop) */}
    {/* Fun Fact (visible, not collapsed on desktop) */}
  </div>
</div>
```

**Collapsible behavior change:**
```typescript
// Desktop: knowledge check, AI tip, fun fact all expanded by default
const [expanded, setExpanded] = useState<Record<string, boolean>>(
  isDesktop
    ? { knowledge: true, aiTip: true, funFact: true }
    : {}  // all collapsed on mobile (current behavior)
);
```

**Crystal gating stays the same** — AI Tip and Knowledge Check still require energy crystals regardless of layout.

### What Changes

| Element | Mobile (current) | Desktop (new) |
|---------|-----------------|---------------|
| Modal width | 440px | 820px |
| Content layout | Single column | Two columns (55/45 split) |
| Knowledge Check | Collapsed accordion | Expanded, right column, always visible |
| AI Tip | Collapsed accordion | Visible in right column |
| Fun Fact | Collapsed accordion | Visible in right column |
| Left column | — | Scrollable (description + objectives) |
| Right column | — | Sticky (interactive content stays visible) |
| Header | Full width | Full width (no change) |
| Footer (CTA) | Full width | Full width (no change) |
| Celebrating phase | Full modal | Full modal (no change) |
| Summary phase | Full modal | Full modal (no change) |

### What Does NOT Change

- Celebrating/summary phases — stay full-modal, centered
- Focus trap, keyboard handling (Escape, Tab)
- Body scroll lock
- XP bounty row + CTA button layout
- Rarity glow, border colors, animations
- Mobile layout — stays exactly as-is
- Crystal gating logic for AI Tip / Knowledge Check

### Acceptance Criteria

- [ ] Desktop (≥768px): modal is 820px wide, two-column layout
- [ ] Mobile (<768px): modal is 440px wide, single-column (no regression)
- [ ] Knowledge Check visible by default on desktop (no accordion click needed)
- [ ] AI Tip visible by default on desktop
- [ ] Fun Fact visible by default on desktop
- [ ] Left column scrolls independently if content overflows
- [ ] Right column is sticky (stays visible while left scrolls)
- [ ] Celebrating phase: full-width, centered (same on both)
- [ ] Summary phase: full-width (same on both)
- [ ] All touch targets ≥ 44px (UX-R153)
- [ ] Crystal gating works in both layouts
- [ ] `prefers-reduced-motion` respected
- [ ] Inline styles only, tokens from `t.*`

---

## BL-004: Dashboard Layout Refactor — Right Sidebar for Secondary Content

**Priority:** P0
**Affects:** `(dashboard)/layout.tsx`, `home/page.tsx`, all sidebar-migrated components
**UX Rules:** UX-R011 (DW sidebar layout), UX-R120 (information density), UX-R100 (door-to-quest < 8s)
**Research:** Duolingo desktop pattern, SaaS cognitive load best practices

### Problem

Main content area is a vertical stack of **8 sections**. Daily Quests — the primary action (80% of user intent) — sits at position #8 after scrolling past greeting, stats, mastery rings, weekly challenges, social cards, and active quests. Users can't find the main action without significant scrolling.

**Current stack (all in main):**
```
1. WelcomeBack (conditional)
2. Greeting + archetype badge
3. StatsRow (level, streak, XP, crystals)
4. Skill Mastery (MasteryRings)
5. Weekly Challenges
6. Social Cards
7. Active Quests (goal cards)
8. Daily Quests  ← PRIMARY ACTION buried here
```

**Benchmark:** Duolingo desktop — center = only learning path (primary action), right sidebar = daily quests, streak, leaderboard, shop.

### Proposed Layout (three-zone)

```
┌──────────┬─────────────────────────────────┬─────────────────────┐
│  LEFT    │            MAIN                  │      RIGHT          │
│ SIDEBAR  │         (primary action)         │   SIDEBAR           │
│          │                                  │  (secondary)        │
│ [Nav]    │  WelcomeBack (conditional)       │                     │
│          │                                  │  Weekly Quests      │
│ [Char]   │  Good morning, Diego!            │   ■■■□□ 3/5         │
│ [Level]  │  Level 3 · 🔥 5 · ⚡ 250 XP     │   ■■■■□ 200/300 XP  │
│          │                                  │   ■■□□ 2/10         │
│          │  ── Today's Quests ────────────  │                     │
│          │  ☐ Read: Foundations      +15 XP │  Skill Mastery      │
│          │  ☐ Watch: Key Concepts   +25 XP │   [Ring] [Ring]     │
│          │  ☐ Quiz: Quick Check     +30 XP │   2 due for review  │
│          │                                  │                     │
│          │  ── Learning Paths ────────────  │  Social Cards       │
│          │  > AI & Machine Learning         │   (opt-in)          │
│          │  > Data Science                  │                     │
│          │                                  │  Weekly League      │
│ [League] │                                  │   #12 / 30 Bronze   │
└──────────┴─────────────────────────────────┴─────────────────────┘
```

### Content Redistribution

| Content | From | To | Rationale |
|---------|------|----|-----------|
| **WelcomeBack** | Main #1 | Main #1 (keep) | Conditional, disappears after action |
| **Greeting + StatsRow** | Main #2-3 | Main #2 (merge into compact header) | Always visible, but compact |
| **Daily Quests** | Main #8 | **Main #3** | PRIMARY ACTION — move up |
| **Active Quests** | Main #7 | **Main #4** | Secondary primary — goal cards below quests |
| **Weekly Challenges** | Main #5 | **Right sidebar #1** | Progress tracking, not action |
| **Skill Mastery** | Main #4 | **Right sidebar #2** | Review reminders, not primary flow |
| **Social Cards** | Main #6 | **Right sidebar #3** | Opt-in, engagement chrome |
| **Weekly League** | (BL-002) | **Right sidebar #4** | Social competition, opt-in |

**Result:** Main content goes from 8 sections → **4 sections** (Welcome, Greeting+Stats, Daily Quests, Active Quests). Door-to-quest goes from 5+ scroll stops → **0-1 scroll**.

### Responsive Behavior

| Breakpoint | Layout | Right sidebar |
|-----------|--------|---------------|
| **≥ 1200px** | 3-column (left nav + main + right sidebar) | Full sidebar, fixed position |
| **1024-1199px** | 3-column, narrower right sidebar | Compact cards, no labels |
| **768-1023px** | 2-column (left nav + main), right sidebar collapses | Horizontal scroll strip below main content |
| **< 768px** | 1-column, bottom tab nav | Right sidebar content moves to dedicated tab or bottom sheet |

### Implementation Notes

**layout.tsx changes:**
```typescript
// Add right sidebar zone to dashboard layout
<div style={{
  display: 'flex',
  maxWidth: 1280,
  margin: '0 auto',
  gap: 24,
}}>
  {/* Left sidebar (existing) */}
  <aside style={{ width: 240, flexShrink: 0 }}>...</aside>

  {/* Main content */}
  <main style={{ flex: 1, minWidth: 0 }}>{children}</main>

  {/* Right sidebar (NEW) */}
  {isDesktop && (
    <aside style={{ width: 300, flexShrink: 0 }}>
      <RightSidebar />
    </aside>
  )}
</div>
```

**Data flow:** Right sidebar needs access to `useWeeklyChallenges`, `useSpacedRepetition`, `quietMode`. Two options:
1. Lift these hooks to layout.tsx and pass via context
2. Keep hooks in individual sidebar components (simpler, recommended)

### Acceptance Criteria

- [ ] Desktop: 3-column layout (left nav + main + right sidebar)
- [ ] Daily Quests visible without scrolling on 1080p screen
- [ ] Right sidebar contains: Weekly Challenges, Skill Mastery, Social Cards
- [ ] Main content contains only: WelcomeBack, Greeting+Stats, Daily Quests, Active Quests
- [ ] Tablet (768-1023px): right sidebar collapses to horizontal strip
- [ ] Mobile (< 768px): sidebar content accessible via tab/sheet
- [ ] No data duplication — components reused, not rewritten
- [ ] Inline styles, tokens from `t.*`
- [ ] Performance: no additional API calls (hooks already fetch data)

---

## BL-005: Weekly Quests — UI/UX Redesign

**Priority:** P1 (blocked by BL-004 — needs sidebar context first)
**Affects:** `WeeklyChallenges.tsx`
**UX Rules:** UX-R105 (endowed progress), UX-R120 (information density), UX-R141 (positive framing)

### Problem

Current Weekly Quests component has poor information hierarchy and density:

```
Weekly Quests                           ← header
Resets in 6d 8h                         ← timer
┌──────────────────────────────────┐
│ Complete 5 quests                │    ← plain text, no icon
│ Tier I                           │    ← RPG tier label, but no visual weight
│ ████░░░░░░░░░░░░░░░░  0/5       │    ← progress bar (empty)
├──────────────────────────────────┤
│ Earn 300 XP                      │
│ Tier III                         │
│ ░░░░░░░░░░░░░░░░░░░░  0/300     │
├──────────────────────────────────┤
│ Review 10 skills                 │
│ Tier II                          │
│ ░░░░░░░░░░░░░░░░░░░░  0/10      │
└──────────────────────────────────┘
```

**Issues:**
1. **No icons** — all 3 challenges look identical, no visual anchor
2. **"Tier I/II/III" means nothing** to new users — RPG vocabulary without visual cue
3. **0/300 for XP** — overwhelming target with zero progress, feels impossible
4. **No reward preview** — user doesn't see what they get for completing
5. **Too much vertical space** — 3 full cards with progress bars, wastes main content area
6. **No urgency calibration** — "6d 8h" has no visual weight difference from "2h left"
7. **Difficulty colors not double-coded** — Easy (green), Medium (blue), Hard (violet) are color-only

### Proposed Redesign — Compact Sidebar Card

```
┌─────────────────────────────┐
│ ⚔ Weekly Quests    5d 14h ↻ │
├─────────────────────────────┤
│                              │
│ ⚡ Complete 5 quests   0/5  │
│ ████████░░░░░░░░░░░░░  Ⅰ   │
│                    +25 XP 🪙5│
│                              │
│ ★ Earn 300 XP        0/300  │
│ ░░░░░░░░░░░░░░░░░░░░  Ⅲ   │
│                    +75 XP 🪙15│
│                              │
│ 📖 Review 10 skills  0/10   │
│ ░░░░░░░░░░░░░░░░░░░░  Ⅱ   │
│                    +50 XP 🪙10│
│                              │
└─────────────────────────────┘
```

### Design Changes

| Element | Current | Proposed |
|---------|---------|----------|
| **Challenge icon** | None | Type-specific: ⚡ (quests), ★ (XP), 📖 (review), 🔥 (streak), 🎯 (accuracy), ⚔ (combat), 🧩 (variety) |
| **Difficulty badge** | "Tier I/II/III" text label | Roman numeral chip with color + border: `Ⅰ` `Ⅱ` `Ⅲ` |
| **Difficulty coding** | Color-only (green/blue/violet) | Double-coded: color + Roman numeral + border style (solid/dashed/double) |
| **Reward preview** | Hidden until completed | Always visible: `+25 XP 🪙 5` under progress bar |
| **Progress bar** | Full-width, 6px height | Slimmer (4px), with percentage glow on bar edge |
| **Timer** | "Resets in 6d 8h" | Compact: "5d 14h ↻". Color shifts: green (>3d), gold (1-3d), rose (<24h) |
| **Card spacing** | 20px padding, 8px gap between cards | 14px padding, 6px gap — 30% more compact |
| **Layout** | Individual bordered cards per challenge | Unified card with dividers (no individual borders) |
| **Zero state** | Shows 0/5 with empty bar | Endowed: "Start any quest to begin!" micro-CTA |
| **Near-complete** | No special treatment | Glow pulse on challenges at ≥ 80% progress |
| **Completed** | Strikethrough + cyan | Checkmark + reward claimed badge + subtle confetti |

### Challenge Type Icons (from WEEKLY_CHALLENGES_SPEC)

| Challenge Type | Icon | NeonIcon type |
|---------------|------|---------------|
| `quest_count` — Complete N quests | ⚡ | `lightning` |
| `xp_earn` — Earn N XP | ★ | `star` |
| `review_count` — Review N skills | 📖 | `book` |
| `streak_maintain` — Maintain streak N days | 🔥 | `fire` |
| `accuracy` — Achieve N% accuracy | 🎯 | `target` |
| `domain_variety` — Complete quests in N domains | 🧩 | `atom` |
| `time_spent` — Spend N minutes learning | ⏱ | `clock` |

### Timer Urgency Colors

| Time remaining | Color | Label |
|---------------|-------|-------|
| > 3 days | `t.textMuted` (#71717A) | Relaxed — no pressure |
| 1-3 days | `t.gold` (#FFD166) | Gentle nudge |
| < 24 hours | `t.rose` (#FF6B8A) | Urgent — but no guilt trip (UX-R103, UX-R141) |
| < 1 hour | `t.rose` + `pulse` animation | Final push — "Almost time! Finish strong, hero!" |

### Compact vs Expanded Mode

When in **right sidebar** (BL-004):
```
┌─────────────────────────────┐
│ ⚔ Weekly Quests    5d ↻     │
│ ⚡ 0/5  ████░░░░░  Ⅰ +25XP │
│ ★ 0/300 ░░░░░░░░░ Ⅲ +75XP │
│ 📖 0/10  ░░░░░░░░░ Ⅱ +50XP │
└─────────────────────────────┘
```
Single line per challenge — icon, fraction, bar, tier, reward. No card borders.

When in **main content** (mobile fallback):
```
┌──────────────────────────────────┐
│ ⚔ Weekly Quests        5d 14h ↻ │
├──────────────────────────────────┤
│ ⚡ Complete 5 quests         0/5 │
│ ████████░░░░░░░░░░░░░░░░░░  Ⅰ  │
│                       +25 XP 🪙5 │
│──────────────────────────────────│
│ ★ Earn 300 XP             0/300 │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░  Ⅲ  │
│                      +75 XP 🪙15 │
│──────────────────────────────────│
│ 📖 Review 10 skills        0/10 │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░  Ⅱ  │
│                      +50 XP 🪙10 │
└──────────────────────────────────┘
```
Full labels, two-line per challenge with reward row.

### Implementation Notes

```typescript
interface WeeklyChallengesProps {
  challenges: Challenge[];
  weekEnd: string;
  compact?: boolean;  // NEW — true in sidebar, false in main
  style?: React.CSSProperties;
}
```

**Timer urgency:**
```typescript
const getTimerStyle = (hoursLeft: number) => {
  if (hoursLeft < 1) return { color: t.rose, animation: 'pulse 2s ease-in-out infinite' };
  if (hoursLeft < 24) return { color: t.rose };
  if (hoursLeft < 72) return { color: t.gold };
  return { color: t.textMuted };
};
```

**Challenge icon mapping:**
```typescript
const CHALLENGE_ICONS: Record<string, NeonIconType> = {
  quest_count: 'lightning',
  xp_earn: 'star',
  review_count: 'book',
  streak_maintain: 'fire',
  accuracy: 'target',
  domain_variety: 'atom',
  time_spent: 'clock',
};
```

### Acceptance Criteria

- [ ] Each challenge has a type-specific icon (NeonIcon, not emoji)
- [ ] Difficulty double-coded: color + Roman numeral + border style
- [ ] Reward preview visible before completion (`+XP`, `+Coins`)
- [ ] Timer color shifts by urgency (muted → gold → rose)
- [ ] `compact` prop for sidebar mode (single-line per challenge)
- [ ] Zero state: encouraging micro-CTA instead of empty bar
- [ ] Near-complete (≥ 80%): subtle glow pulse on progress bar
- [ ] Completed: checkmark + reward badge, no strikethrough (positive framing)
- [ ] 30% less vertical space than current implementation
- [ ] All colors from tokens, inline styles only
- [ ] Accessibility: progress bar has `aria-valuenow`, `aria-valuemax`
- [ ] `prefers-reduced-motion`: no pulse animation on timer

---

## BL-006: Post-Daily-Quest Completion Flow — Discovery

**Priority:** P0 (Discovery)
**Status:** NEEDS DISCOVERY — не імплементувати без рішень
**Affects:** `DailyQuests.tsx`, `home/page.tsx`, progression system, subscription tiers
**Cross-ref:** EFA §7 Economy & Monetization, ENGAGEMENT_FRAMEWORK_ARCHITECTURE §4 Retention

### Problem

Що відбувається коли юзер виконав ВСІ daily quests? Зараз — нічого. Empty state "All quests complete!" і юзер закриває аппку. Це **retention leak** — мотивований юзер хоче продовжувати, але ми його блокуємо.

### Два сценарії

#### Сценарій A: Free Tier

**Питання:** Юзер виконав всі daily quests. Що далі?

**Варіанти для discovery:**

| Варіант | Опис | Pros | Cons |
|---------|------|------|------|
| A1: Hard gate | "Come back tomorrow, hero!" | Simple, creates habit loop (Duolingo model) | Frustrates power users, churn risk |
| A2: Soft gate + review | Дозволити Spaced Repetition reviews (безлімітно) | Keeps user engaged, learning value | No new content, може стати нудним |
| A3: Soft gate + bonus quest | 1 додатковий "bonus quest" за перегляд реклами або XP | Monetization path, user choice | Ads = dark pattern risk, ethical concerns |
| A4: Unlockable extra quests | 2-3 extra quests розблоковуються після completion всіх daily | More content, no paywall | Devalues daily quest system, users may ignore daily and wait for extras |
| A5: Exploration mode | Дозволити browse roadmap і read-only preview наступних квестів | Builds anticipation, no XP exploitation | No action, passive |

**Duolingo benchmark:** Hard gate на hearts (lives). Виконав уроки → чекай або купи Super Duolingo. Але: Duolingo дозволяє Practice (review) безлімітно навіть на free tier.

**Рекомендований напрямок (потребує валідації):** A2 + A5 — дозволити безлімітні reviews + browse roadmap, але нових квестів до завтра.

#### Сценарій B: Premium Tier

**Питання:** Преміум юзер виконав daily quests. Як дати йому рухатись далі по roadmap?

**Варіанти для discovery:**

| Варіант | Опис | Pros | Cons |
|---------|------|------|------|
| B1: Unlimited quests | Premium = без daily cap, бери скільки хочеш | Clear value prop, power users love it | Anti-gaming risk, XP inflation, burnout |
| B2: Extended daily (+3-5) | Premium отримує 3-5 додаткових квестів на день | Balanced, clear upgrade path | Arbitrary limit, "why not more?" |
| B3: Roadmap unlock | Premium може advance по roadmap topics (наступні milestone) | Real progression value, not just more of same | Complex to implement, roadmap must be ready |
| B4: Priority AI content | Premium отримує AI-generated quests on demand по roadmap | Fresh content, personalized | AI latency, quality control, cost |
| B5: Session-based unlock | Premium: кожні 30 хв active time → unlock 1 bonus quest | Rewards engagement, not grinding | Complex tracking, time-based = problematic |

**Ключове рішення:** Premium value = **більше контенту** чи **швидший прогрес**? Різні retention стратегії:
- Більше контенту → B2/B4 (horizontal: more quests same level)
- Швидший прогрес → B3 (vertical: advance to next milestone faster)

**Рекомендований напрямок (потребує валідації):** B3 + B2 — Premium розблоковує наступні roadmap milestones + 3-5 додаткових quests/день. AI-generated (B4) як Phase 7+ stretch goal.

### Open Questions (потрібні відповіді перед імплементацією)

| # | Питання | Варіанти | Impact |
|---|---------|----------|--------|
| Q1 | Скільки daily quests на free tier? | 3 / 5 / dynamic | Defines ceiling, affects all scenarios |
| Q2 | Чи рахуються reviews у daily cap? | Yes / No | Якщо yes → A2 не працює як soft gate |
| Q3 | Premium = скільки додаткових quests? | +3 / +5 / unlimited | B1 vs B2, XP balance |
| Q4 | Чи дозволяти advance roadmap на free tier (без quests)? | Yes (read-only) / No | A5 feasibility |
| Q5 | Як захиститись від XP inflation на premium? | Daily XP cap / diminishing returns / separate leaderboard | Anti-gaming, fairness |
| Q6 | Який subscription tier дає roadmap unlock? | Pro / Premium / Enterprise | EFA §7 tier mapping |
| Q7 | Чи потрібен "energy crystal" refill mechanic? | Yes (existing crystals) / No (new system) | Reuse existing vs new |

### Ethical Constraints (BLOCKER)

- **No artificial urgency** — "Come back tomorrow" = позитивний framing, не guilt ("You're missing out!")
- **Free tier = повний продукт** — daily quests мають бути достатньо для реального прогресу
- **No pay-to-win** — premium = більше content/speed, не exclusive features
- **No ads gate** — варіант A3 (ad-gated bonus quest) потребує окремого ethical review
- **Burnout protection** — навіть premium не повинен заохочувати 8+ годин/день

### UX States to Design

```
Daily Quests:
  has_quests → completing → all_done → ???

Post-completion (free):
  all_done → show_completion_celebration
           → suggest_reviews (if due)
           → show_roadmap_preview
           → "See you tomorrow, hero!"

Post-completion (premium):
  all_done → show_completion_celebration
           → unlock_bonus_quests
           → suggest_roadmap_advance
           → suggest_reviews (if due)
```

### Discovery Deliverables

- [ ] User research: interview 5-10 beta users about post-completion behavior
- [ ] Competitive analysis: Duolingo, Brilliant, Codecademy, Coursera — what happens after daily limit?
- [ ] Data model: define `subscription_tier.daily_quest_limit` and `subscription_tier.roadmap_advance`
- [ ] Prototype: Figma/code prototype of post-completion screen (free + premium)
- [ ] XP balance model: simulate 30-day XP curves for free vs premium at different quest counts
- [ ] Ethical review: run through CLAUDE.md Крок 10 ethical checklist for each variant

### Dependencies

- Subscription tier system (EFA Phase 7, not yet built)
- Roadmap progression model (roadmap service exists, but no "advance to next milestone" logic)
- AI content generation pipeline (for B4, Phase 7+ scope)

### Timeline

This is **discovery only** — no implementation until:
1. Open Questions Q1-Q7 answered
2. At least one variant per scenario validated with users
3. Subscription tier mapping finalized (requires Phase 7 planning)

---

## BL-007: Interactive Roadmap Visualization — Discovery

**Priority:** P0 (Discovery)
**Status:** NEEDS DISCOVERY — не імплементувати без дизайн-рішень
**Affects:** `(dashboard)/roadmap/page.tsx`, potentially new components
**UX Rules:** UX-R100 (door-to-quest), UX-R105 (endowed progress), UX-R141 (positive framing)
**Cross-ref:** EFA §3 Quest Engine, ONBOARDING_V2 (goals → milestones)

### Problem

Після онбордінгу юзер має roadmap з goals → milestones → quests. Але зараз roadmap page (`roadmap/page.tsx`) — це статичний вертикальний timeline з hardcoded фазами (Foundations → Core → Projects → Advanced → Capstone). Немає:

1. **Візуальної шкали прогресу** — юзер не бачить де він на своєму шляху
2. **Проміжних цілей** (milestones) — тільки фази, без checkpoint celebrations
3. **Кінцевої цілі** — немає фінальної "Trophy" або "Boss challenge" візуалізації
4. **Інтерактивності** — не можна клікнути на milestone щоб побачити деталі
5. **Зв'язку з daily quests** — roadmap і daily quests живуть окремо

### Competitive Analysis

#### Duolingo Learning Path
- **Vertical scroll** з zigzag pattern (nodes йдуть ліво→право→ліво)
- **Circles = lessons**, grouped into **Units** (5-8 lessons кожна)
- **Unit checkpoints** — challenge quiz наприкінці кожного unit
- **Legendary trophies** — per-unit mastery trophy (gold)
- **States:** locked (сірий) → active (кольоровий + пульс) → complete (золотий) → legendary (purple crown)
- **Scroll indicator** — floating arrow button для jump back to current position
- **Pros:** clear progression, celebration per unit. **Cons:** дуже довгий scroll, repetitive

#### Codecademy Career Path
- **Vertical syllabus** з collapsible modules
- **Milestones** — named sections (e.g., "Web Foundations", "JavaScript")
- **Progress bar** per module + global progress percentage
- **Certificate** at end of path
- **Pros:** clear structure, professional. **Cons:** boring, no gamification

#### Brilliant.org
- **Course cards** in learning paths (sequential)
- **Completion indicators** per course
- **No visual path** — just a list with progress
- **Pros:** clean, focused. **Cons:** no sense of journey

#### Game UI (RPG Skill Trees)
- **Node-based** — circles/hexagons connected by lines
- **Branching** — multiple paths possible
- **Glow/particles** on active/unlockable nodes
- **Boss nodes** — larger, special treatment
- **Pros:** exciting, RPG-native. **Cons:** can be confusing for non-gamers

### Proposed Concept: Horizontal Quest Map with Trophy Shelf

**Формат:** горизонтальна шкала з тrophies/medals зверху і milestone names знизу. Scroll-based navigation.

```
                    🏆              🏆              🏆         🏅
                   (gold)          (gold)          (silver)   (final)
     ●━━━━━━━●━━━━━━━●━━━━━━━●━━━━━━━●━━━━━━━●━━━━━━━●━━━━━━━●
     ▲       ▲       ▲       ▲       ▲       ▲       ▲       ▲
     │       │       │       │       │       │       │       │
  START  Basics   Setup  Concepts  Build  Advanced Pattern  BOSS
          ✓        ✓       ✓        ◉       ○        ○       ○
        done     done    done    active  locked  locked   locked
```

**Top shelf:** Trophies/medals float above milestones. Earned = gold/colored glow, locked = silhouette/outline.

**Progress line:** Horizontal bar with gradient fill (violet → cyan). Current position = glowing dot.

**Milestones below line:** Name + status badge. Click to expand details.

### Visual States (per milestone node)

| State | Visual | Top shelf | Node | Label |
|-------|--------|-----------|------|-------|
| **Completed** | Gold glow, filled circle | 🏆 gold trophy, celebratePop | `●` solid cyan | Name + "✓ Complete" |
| **Active** | Violet pulse, animated ring | 🏆 outline (teasing) | `◉` pulsing violet ring | Name + "In Progress" + quest count |
| **Locked** | Dim, no glow | `🔒` silhouette | `○` grey outline | Name + "Locked" |
| **Boss/Final** | Special treatment — larger, crown icon | 🏅 large medal, sparkle | `★` larger node | Name + "Final Challenge" |

### Trophy/Medal Types

| Milestone Type | Trophy | Visual |
|---------------|--------|--------|
| Phase completion (e.g., "Foundations done") | 🏆 Phase Trophy | Gold cup with rarity glow matching phase rarity |
| Mid-phase checkpoint | 🎖 Checkpoint Medal | Silver/bronze medal, smaller |
| Skill mastery milestone | ⭐ Mastery Star | Star badge with mastery level color |
| Final goal completion | 🏅 Grand Trophy | Large trophy with confetti particles + character celebration |

### Layout Variants to Explore

#### Variant A: Horizontal Timeline (Trophy Shelf)
```
Trophies:    🏆        🏆        🏆        🏅
Line:     ●━━━━━●━━━━━●━━━━━●━━━━━●━━━━━●
Labels:  Start  Basics  Core   Build  BOSS
```
- Horizontal scroll, left-to-right progression
- Trophies float above the line
- Good for: showing overall journey at a glance
- Risk: horizontal scroll can be awkward on mobile

#### Variant B: Vertical Winding Path (Duolingo-inspired)
```
    ●  Foundations
   /
  ●  Setup Complete
   \
    ●  Core Concepts 🏆
   /
  ●  First Project
   \
    ●  BOSS FIGHT 🏅
```
- Vertical scroll, zigzag left↔right
- More space per milestone for details
- Good for: mobile-first, Duolingo-familiar
- Risk: feels like Duolingo clone

#### Variant C: Mountain Climb (altitude metaphor)
```
                                        🏅 SUMMIT
                                    ●──●/
                                ●──●  /
                            ●──● 🏆 /
                        ●──●      /
          START ●──●──●  🏆     /
```
- Diagonal progression = climbing towards goal
- Altitude = progress percentage
- Trophies at "base camps" (phase transitions)
- Good for: emotional impact, "climbing towards your dream"
- Risk: complex SVG, may not work well on small screens

#### Variant D: Board Game Map (Super Mario-style)
```
┌───────────────────────────────────────────────┐
│   🏰                                          │
│   ╱                                           │
│  ●─●─●     ●─●─●     ●─●─●     ●─●─★       │
│      ╲   ╱🏆    ╲   ╱🏆    ╲   ╱🏅          │
│       ●─●         ●─●         ●─●             │
│                                               │
│  [Character walks along the path]             │
└───────────────────────────────────────────────┘
```
- Board game aesthetic with character walking along path
- Character pixel art stands on current node
- Good for: RPG theming, character engagement
- Risk: complex animations, may feel childish

### Data Model Considerations

Currently `roadmap/page.tsx` uses hardcoded `PHASES[]`. Real roadmap needs:

```typescript
interface RoadmapMilestone {
  id: string;
  title: string;                    // "Master Foundations"
  description: string;
  phase: number;                    // 1-5
  order: number;                    // order within phase
  rarity: RarityTier;              // visual treatment
  status: 'locked' | 'active' | 'completed';
  questCount: number;               // total quests in milestone
  completedQuestCount: number;      // progress
  trophy: TrophyType | null;        // earned trophy
  isBoss: boolean;                  // final challenge
}

interface RoadmapGoal {
  goalId: string;
  goalLabel: string;
  milestones: RoadmapMilestone[];
  overallProgress: number;          // 0-1
  estimatedWeeksLeft: number;
}
```

**Source of truth:** Backend should generate milestones from onboarding goals + AI roadmap generation. Current hardcoded phases are placeholder.

### Open Questions

| # | Питання | Варіанти | Impact | **РІШЕННЯ** |
|---|---------|----------|--------|-------------|
| Q1 | Horizontal або vertical layout? | A (horizontal) / B (vertical) / C (mountain) / D (board game) | Core visual direction | **✅ ВИРІШЕНО: Card Grid + Drill-Down ("Quest Map").** Hub page = responsive card grid (2-3 cols desktop, 1 col mobile). Кожна картка = Quest Line Card з mini-timeline, XP bar, quest count, streak, rarity border, domain icon. Клік → drill-down до повного горизонтального timeline з Trophy Shelf. Індустрія підтвердила: Coursera, Codecademy, Khan Academy, Brilliant, roadmap.sh — всі використовують Card Grid. RPG ігри (WoW, Skyrim) — категоризований список + detail. Жодна навчальна платформа не використовує паралельні таймлайни. |
| Q2 | Скільки milestones per goal? | 5 (phases) / 8-12 (finer-grained) / AI-generated | Data model, visual density | **✅ ВИРІШЕНО: AI-generated (динамічно).** AI визначає кількість milestones (5-12) залежно від goal складності, skill level юзера, estimated weeks. Prompt включає: min 5 / max 12 milestones, кожен milestone = 3-8 quests, останній milestone = Boss Challenge. Data model: `milestoneCount` не фіксований, timeline компонент рендерить динамічну кількість нод. |
| Q3 | Чи показувати multiple goals на одній шкалі? | Tabs (current) / parallel tracks / merged timeline | Layout complexity | **✅ ВИРІШЕНО: Card Grid (з Q1).** Кожен goal = окрема картка на Quest Map hub. Ніяких tabs/parallel tracks/merged timeline. Масштабується 2-7+ goals. Optional: "This Week" merged view для cross-roadmap weekly overview. |
| Q4 | Чи character pixel art стоїть на поточному node? | Yes / No | Animation complexity, brand identity | **✅ ВИРІШЕНО: Так.** Pixel art персонажа (обраний на онбордінгу) стоїть на активному milestone node з float анімацією. При завершенні milestone — персонаж переходить на наступний node (Meso анімація, 400-1200ms). Board game / Super Mario стиль. Підсилює emotional connection з прогресом. |
| Q5 | Чи trophy shelf — real achievements або visual decoration? | Real (linked to achievement system, Phase 5E) / Visual only | Backend integration | **✅ ВИРІШЕНО: Real achievements.** Трофеї = повноцінні achievements з Phase 5E. Кожен завершений milestone → achievement unlock (badge + XP + celebration). Трофеї з'являються на Hero Card як pinned badges. Near-unlock teasing (UX-R105) при ~75% прогресу milestone. Інтеграція через існуючий achievement.service.ts + AchievementBadge компонент. |
| Q6 | Чи roadmap = daily quests source? | Yes (quests come from roadmap) / No (separate systems) | Architecture, quest engine changes | **✅ ВИРІШЕНО: Так, roadmap = quest source.** Daily quests генеруються з активного milestone roadmap. Завершив всі quests milestone → milestone complete → персонаж йде далі → наступний milestone стає active → нові quests. Єдиний прогрес flow: daily home quests ↔ roadmap timeline — одна система. Quest engine змінюється: AI генерує quests по темі активного milestone. |
| Q7 | Mobile layout — що робити з horizontal? | Horizontal scroll / Switch to vertical / Compact mode | Responsive strategy | **✅ ВИРІШЕНО: Horizontal scroll.** Той самий horizontal timeline на mobile з touch swipe. Auto-scroll до active node (персонажа) при відкритті. Snap scrolling (зупинка на milestone, не між). Peek edges — сусідні ноди видно частково (affordance). Індустріальний стандарт: Duolingo, Spotify, Netflix, iOS App Store — всі horizontal scroll на mobile. |
| Q8 | Як обробляти roadmap з AI latency? | Skeleton + progressive reveal / Pre-generate during onboarding / Cache | UX during generation | **✅ ВИРІШЕНО: Комбінація всіх трьох.** 1) Pre-generate під час onboarding forge step (anvil анімація маскує latency). 2) Skeleton UI як fallback якщо AI не встигла. 3) Кешування в БД завжди — AI НЕ генерує щоразу заново. Roadmap генерується і оновлюється ТІЛЬКИ через wizard flow. Єдиний хто може впливати на roadmap поза wizard = AI Director (→ Phase 6+ backlog item). |

### Discovery Deliverables

- [ ] Choose layout variant (A/B/C/D) — design review with mockups
- [ ] Define milestone granularity (how many per goal)
- [ ] Design trophy/medal visual system (pixel art? SVG? both?)
- [ ] Prototype interactive scroll behavior (horizontal vs vertical)
- [ ] Define data model for milestones (server-side)
- [ ] Decide roadmap ↔ quest engine integration
- [ ] Mobile responsive strategy
- [ ] Accessibility: keyboard navigation through nodes, screen reader milestone descriptions

### References

- [Duolingo Learning Path Design](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- [Duolingo Units & Checkpoints](https://cherishstudy.com/duolingo-units-and-checkpoints/)
- [Codecademy Career Path Redesign](https://www.codecademy.com/resources/blog/career-path-redesign)
- [Brilliant.org Learning Paths](https://brilliant.org/help/using-brilliant/what-are-learning-paths/)
- [Game UI Database — Skill Trees](https://www.gameuidatabase.com/index.php?scrn=64)
- [Gamification in Product Design 2025](https://arounda.agency/blog/gamification-in-product-design-in-2024-ui-ux)
- [Dashboard Design Cognitive Overload](https://www.sanjaydey.com/saas-dashboard-design-information-architecture-cognitive-overload/)

---

## BL-008: Roadmap Completion & Next Journey Transition — Discovery

**Priority:** P0 (Discovery)
**Status:** NEEDS DISCOVERY — не імплементувати без дизайн-рішень
**Affects:** `(dashboard)/roadmap/page.tsx`, `home/page.tsx`, progression system, AI content pipeline
**UX Rules:** UX-R100 (door-to-quest), UX-R105 (endowed progress), UX-R108 (session extension), UX-R141 (positive framing), UX-R164 (celebrations interruptible)
**Cross-ref:** EFA §3 Quest Engine, §7 Economy, ONBOARDING_V2 (goals → milestones), BL-007 (roadmap visualization)
**GDPR:** §F — тренди використовують анонімну агрегацію (min 50 юзерів в групі)

### Problem

Юзер пройшов весь roadmap — усі milestones, всі quests. Це **dead-end**. Зараз нічого не відбувається — юзер бачить 100% прогрес і... все. Ні celebration, ні наступного кроку. Це **retention catastrophe** — найбільш мотивований юзер залишається без напрямку.

### Три фази transition flow

#### Phase 1: Completion Celebration 🎉

Юзер завершив останній quest останнього milestone. Тригерится **Macro celebration** (1200-3000ms, interruptible):

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│            ✨  ROADMAP COMPLETE!  ✨                    │
│                                                        │
│         [Character pixel art — victory pose]           │
│                                                        │
│    🏅 Grand Trophy: "AI & Machine Learning Master"     │
│                                                        │
│   ┌──────────────────────────────────────────────┐     │
│   │  📊 Your Journey in Numbers                  │     │
│   │                                              │     │
│   │  ⚡ 47 Quests completed                      │     │
│   │  ⭐ 2,850 XP earned                          │     │
│   │  🔥 Best streak: 14 days                     │     │
│   │  📖 5 Skills mastered                         │     │
│   │  ⏱  ~42 hours invested                       │     │
│   │  🏆 12 Achievements unlocked                  │     │
│   └──────────────────────────────────────────────┘     │
│                                                        │
│              [Claim Trophy & Continue →]                │
│              Tap anywhere to skip                       │
└────────────────────────────────────────────────────────┘
```

**Stats summary:**
- Total quests completed in this roadmap
- Total XP earned during this roadmap
- Best streak achieved
- Skills mastered (mastery level ≥ 4)
- Estimated time invested (based on quest durations)
- Achievements unlocked during this roadmap

**Achievement unlock:** Completing a roadmap → achievement `roadmap_complete` (Epic rarity, +200 XP).

#### Phase 2: Trophy Claim

After celebration, the trophy is added to Hero Card. Equipment slot consideration: trophy could be a new `trophy_case` display slot (cosmetic, no stats). Or simply an achievement badge.

#### Phase 3: Next Journey Proposal 🗺️

After trophy claim, юзер бачить **"What's Next?"** screen з 4 варіантами:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  🗺️  Your journey continues, Hero!                    │
│  Choose your next adventure:                           │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🤖 AI-Generated Roadmap              (A)    │     │
│  │ Based on your skills & interests, we'll      │     │
│  │ craft a personalized next chapter             │     │
│  │                                               │     │
│  │ "We've analyzed your strengths and            │     │
│  │  suggest: Advanced Neural Networks"           │     │
│  │                                               │     │
│  │ [Generate My Roadmap →]                       │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ ✏️  Custom Goals                       (B)    │     │
│  │ Set your own goals — AI generates             │     │
│  │ the quest content to get you there            │     │
│  │                                               │     │
│  │ [Set My Goals →]                              │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ ⚔️  Alternative Skills               (C)    │     │
│  │ Branch into complementary domains             │     │
│  │ Unlock new equipment & skill trees!           │     │
│  │                                               │     │
│  │ Suggested: Data Engineering, MLOps            │     │
│  │                                               │     │
│  │ [Explore Skills →]                            │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🔥 Trending Paths                      (D)    │     │
│  │ See what other heroes are learning            │     │
│  │                                               │     │
│  │ 📈 "Prompt Engineering" — 1.2K heroes         │     │
│  │ 📈 "AI Agents" — 890 heroes                   │     │
│  │                                               │     │
│  │ [Browse Trends →]                             │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ──────────────────────────────────────────────────    │
│  Or: Review & strengthen your current skills           │
│  [Continue Reviews →]                                  │
└────────────────────────────────────────────────────────┘
```

### Option Details

#### Option A: AI-Generated Roadmap

**Flow:** User clicks "Generate" → AI analyzes completed roadmap + skill assessments + mastery levels → generates next roadmap.

**Implementation:**
- Input: completed goals, mastery levels, archetype, time preferences (from onboarding)
- AI prompt includes: completed topics (don't repeat), skill gaps (mastery < 4), user's domain, RPG glossary
- Output: new roadmap with 3-5 goals, milestones, quests
- **Latency strategy:** skeleton UI + progressive reveal (same as onboarding, see ONBOARDING_V2 §7)
- User can regenerate (1-2 alternatives) before accepting

**Edge cases:**
- AI generates duplicate content → dedup against completed quests
- AI generates content outside user's domain → domain filter in prompt
- User regenerates >3 times → suggest Option B (custom goals)

#### Option B: Custom Goals

**Flow:** User sets own goals → goes through mini-onboarding (reuse `/goal/direct` flow from v2) → AI generates quest content for those goals.

**Implementation:**
- Reuse onboarding v2 goal selection UI (interest picker, domain cards)
- Skip archetype/character selection (already done)
- AI generates milestones + quests for new goals
- Preserves existing character, equipment, XP, achievements

**UX consideration:** This is NOT re-onboarding. Frame as "New chapter, same hero." Character stays, progress stays, just new goals.

#### Option C: Alternative Skills (Equipment System Integration)

**Flow:** Show complementary skill domains based on current expertise → selecting new domains unlocks domain-specific equipment.

**Implementation:**
- Algorithm: find skill domains adjacent to user's completed domain
  - AI & ML → Data Engineering, MLOps, Cloud Architecture
  - Web Development → Mobile Dev, DevOps, System Design
  - Business → Product Management, Data Analytics, Leadership
- Each domain card shows:
  - Domain name + icon
  - "Unlocks: [equipment item]" — connects to Phase 5F equipment system
  - Estimated timeline
  - Difficulty relative to current skills

**Equipment integration:** Starting a new skill domain → "Domain Explorer" equipment set becomes available. Provides attribute bonuses for that domain's quests.

#### Option D: Trending Paths (Anonymized Community Data)

**Flow:** Show what other users are learning, aggregated & anonymized.

**Implementation:**
- Backend aggregates: `SELECT skill_domain, COUNT(DISTINCT user_id) as hero_count FROM roadmap WHERE created_at > now() - interval '30 days' GROUP BY skill_domain HAVING COUNT(DISTINCT user_id) >= 50`
- **GDPR compliant:** min 50 users per group for anonymity (see CLAUDE.md Крок 11)
- Show top 3-5 trending domains with hero count
- Click → generates AI roadmap for that domain (same as Option A but with pre-selected topic)
- **No PII exposed** — only aggregate counts, no usernames

**Data freshness:** Recalculate weekly (pg_cron job), cache in Redis/MART view.

### State Machine

```
roadmap_journey:
  in_progress
    → completing_final_quest
    → celebration (Macro animation, interruptible)
    → trophy_claim
    → next_journey_proposal
      → option_a_generating (AI roadmap)
      → option_b_custom_goals (mini-onboarding)
      → option_c_explore_skills (domain picker)
      → option_d_trending (browse trends)
      → continue_reviews (stay in current domain)
    → new_roadmap_active (back to in_progress with new roadmap)
```

### Data Model Additions

```typescript
// New fields on User / Roadmap model
interface RoadmapCompletion {
  roadmapId: string;
  completedAt: string;           // ISO timestamp
  totalQuestsCompleted: number;
  totalXpEarned: number;
  bestStreak: number;
  skillsMastered: string[];      // skill domain IDs with mastery ≥ 4
  timeInvestedMinutes: number;
  achievementsUnlocked: string[];
  trophyId: string;              // reference to earned trophy
  nextRoadmapId: string | null;  // chain to next roadmap
}

// Trending domains (MART view)
interface TrendingDomain {
  skillDomain: string;
  heroCount: number;             // anonymized, min 50
  growthPercent: number;         // week-over-week change
  avgCompletionWeeks: number;    // anonymized average
}
```

### Open Questions

| # | Питання | Варіанти | Impact | **РІШЕННЯ** |
|---|---------|----------|--------|-------------|
| Q1 | Чи trophy = achievement badge чи окремий equipment slot? | Achievement (simpler) / Trophy Case slot (richer) | Phase 5E vs 5F integration | **✅ ВИРІШЕНО: Achievement badge.** Trophy = Epic achievement (roadmap_complete, +200XP). Badge на Hero Card. Використовує існуючу Phase 5E achievement систему. Без нового equipment slot. |
| Q2 | Скільки AI regenerations дозволяти? | 1 / 3 / unlimited | AI cost, UX | **✅ ВИРІШЕНО: 3 рази.** Оригінал + 3 regenerations. Після 3 — пропонувати Option B (custom goals). RPG: "Три спроби долі, герою!". Баланс між user choice і AI cost. |
| Q3 | Чи "Continue Reviews" = full UX чи просто redirect? | Full card with stats / Just a text link | Design effort | **✅ ВИРІШЕНО: Full card (рівна вага).** "Continue Reviews" = повноцінна 5-та картка нарівні з іншими 4 опціями. Той самий card component, RPG vocabulary ("Sharpen Your Skills"), mastery ring, due count badge, XP indicator. Порядок карток адаптивний: якщо є overdue SM-2 reviews → Review card першою; інакше → New Path першою. Обґрунтування: UX-R108 (equal prominence), UX-R163 (no confirmshaming), UX-R001 (Autonomy). 6/8 продуктів (Duolingo, Khan, Headspace, Peloton, FFXIV, WoW) показують practice з рівною вагою. Text link = dark pattern для spaced repetition платформи. |
| Q4 | Чи Option C (Alt Skills) = Phase 5F equipment unlock? | Yes (requires 5F) / No (just goals, no equipment) | Dependency | **✅ ВИРІШЕНО: Так, equipment unlock.** Новий skill domain → "Domain Explorer" equipment set стає доступним. Domain card показує "Unlocks: [item]". Залежність від Phase 5F equipment system. |
| Q5 | Чи trending data = real-time чи weekly snapshot? | Real-time / Weekly cache / Daily cache | Infra cost | **✅ ВИРІШЕНО: Weekly cache.** Перерахунок раз/тиждень (pg_cron), кеш в MART view. Мінімальний infra cost. GDPR k-anonymity: показуємо domain ТІЛЬКИ якщо ≥50 юзерів в ньому (Art. 89). На ранніх стадіях trending може бути порожнім — empty state: "Not enough heroes yet." |
| Q6 | Чи можна повернутись до "What's Next?" після вибору? | Yes (settings page) / No (one-time choice) | Re-entry UX | **✅ ВИРІШЕНО: Так, через Quest Map.** Не one-time choice. Юзер будь-коли може додати новий roadmap через "+Add Quest Line" button на Quest Map hub page. What's Next? — це transition moment, не єдина точка входу. |
| Q7 | Як обробляти multiple completed roadmaps? | Trophy collection page / Timeline view / Achievement wall | Long-term UX | **✅ ВИРІШЕНО: Trophy collection на Hero Card.** Завершені roadmaps = achievement badges на Hero Card (консистентно з Q5). Quest Map hub показує всі картки: active (кольорові) + completed (з золотим "✓ Complete" badge). Нема окремої Trophy Hall сторінки. |
| Q8 | Free vs Premium: чи всі 4 опції доступні на free tier? | All free / Option A only premium / Option D only premium | Monetization | **✅ ВИРІШЕНО: Все безкоштовно.** Всі 5 опцій доступні на free tier (UX-R160: "free = повний продукт"). Premium = "more": більше AI regenerations, більше active roadmaps, rare cosmetics. Ніякого гейтингу на retention-critical moment. |

### Ethical Constraints (BLOCKER)

- **No dead-end guilt** — completion = celebration, NOT "you're falling behind"
- **All options feel equal** — no dark patterns pushing premium options
- **Trending = aggregated only** — min 50 users, no individual data
- **AI recommendations = transparent** — "Based on your completed skills" (not manipulative)
- **Continue Reviews = always available** — user should never feel forced to start new roadmap
- **Trophy = permanent** — completed roadmap achievements are never lost, even if user doesn't start new one

### Discovery Deliverables

- [ ] Design celebration screen (Macro animation + stats summary)
- [ ] Design "What's Next?" screen (4 options layout)
- [ ] Define trophy visual system (connect to BL-007 trophy shelf)
- [ ] AI roadmap generation prompt engineering (avoid repeats, match level)
- [ ] Alternative skills adjacency algorithm (domain → related domains)
- [ ] Trending data pipeline (aggregation query, caching, GDPR min-group check)
- [ ] Define transition UX: does user stay on roadmap page or go to dedicated transition page?
- [ ] Multiple-completion UX: what does the app look like for a user on their 3rd roadmap?
- [ ] Equipment integration design (Option C, depends on Phase 5F)

### Dependencies

- **BL-007** — Roadmap visualization (trophy shelf visual system)
- **Phase 5F** — Equipment system (for Option C domain equipment unlock)
- **Phase 7** — AI content pipeline (for Option A roadmap generation at scale)
- **Trending data** — requires enough users (50+) per domain for GDPR-safe aggregation
- **AI Director** — Phase 6+ backlog: AI Director може динамічно впливати на roadmap (рекомендувати зміни milestones, адаптувати складність). Потрібен окремий brainstorm. Зараз roadmap змінюється ТІЛЬКИ через wizard flow.

---

## BL-009: Hero Attributes on Dashboard + Parallel Skills Upsell — Discovery

**Priority:** P0 (Discovery)
**Status:** NEEDS DISCOVERY — два компоненти: UI display + monetization flow
**Affects:** `home/page.tsx`, `hero-card/page.tsx`, `(onboarding)/`, new `skill-add` flow
**UX Rules:** UX-R100 (door-to-quest), UX-R105 (endowed progress), UX-R108 (session extension), UX-R120 (info density), UX-R141 (positive framing)
**Cross-ref:** Phase 5F (Equipment & Attributes), Phase 7 (Monetization), EQUIPMENT_LOOT_SPEC.md §12 (Attribute Computation)
**Research:** Diablo 4 stat allocation, Pokemon hexagonal chart, FIFA UT player cards, Genshin constellation system, Grammarly quantified gap, Duolingo energy paywall, Brilliant key system

### Problem (Three-Part)

**1. Attributes are invisible on the main screen.**
Hero Attributes (MAS, INS, INF, RES, VER, DIS) exist in the codebase (types, DB, service, store) but are only shown on the Hero Card page (behind navigation). Users don't know they can grow in 6 dimensions — вони бачать тільки XP + level + streak.

**2. No mechanism to add parallel skill tracks.**
After onboarding, the user has one roadmap with one skill domain. There's no way to add a second skill domain without re-onboarding. The attribute system (especially VER/Versatility and DIS/Discovery) implies breadth, but there's no UX to act on it.

**3. No premium upsell connected to skills.**
Premium tier value prop is undefined for skill expansion. Free tier should have one active roadmap; premium should allow multiple parallel roadmaps that grow different attributes.

### Part A: Hero Attributes Display on Dashboard

#### Current State

```
apps/web/app/(dashboard)/hero-card/page.tsx  lines 227-277
→ 6 horizontal bars, all hardcoded to value 10
→ TODO comment: "Phase 5F: compute from equipment + mastery"
→ NOT shown on home/page.tsx at all
```

#### Proposed: Compact Attribute Widget on Dashboard

**Location:** Right sidebar (BL-004) or below StatsRow on main (fallback if no sidebar yet)

##### Option 1: Hexagonal Radar Chart (Recommended for Hero Card)

```
         MAS
          ▲
    DIS ╱   ╲ INS
       │  ◇  │
    VER ╲   ╱ RES
          ▼
         INF
```

- Small (160-180px) hexagonal SVG radar chart
- **Current values:** Solid polygon, fill with gradient (violet→cyan) at 30% opacity
- **Potential/target:** Dashed outline at 15% opacity showing "next milestone" threshold
- **"Growth zone"** = visible gap between current and potential = aspirational visibility
- Attribute abbreviations at each vertex with colored icon
- Tap → navigate to Hero Card for full view
- Animated expansion when stat increases (polygon grows on one axis, Micro tier 200ms)

##### Option 2: Mini Attribute Bars (Recommended for Dashboard)

Compact 2×3 grid of mini bars:

```
┌─────────────────────────────────────┐
│ ⚔ MAS 14  ████████░░ │ ◈ INS 11  ██████░░░░ │
│ ◉ INF 16  ██████████ │ ◆ RES 12  ████████░░ │
│ ✦ VER  8  ████░░░░░░ │ ★ DIS 15  █████████░ │
│                                     │
│ ✦ VER is your quietest attribute    │
│   Explore a new domain →            │
└─────────────────────────────────────┘
```

- Color-coded per attribute (MAS=#9D7AFF, INS=#3B82F6, INF=#FF6B8A, RES=#6EE7B7, VER=#4ECDC4, DIS=#FFD166)
- Lowest stat gets **highlight nudge**: "VER is your quietest attribute. Explore a new domain →"
- Near threshold: "2 more to unlock Tier II quests!"
- "+N" floating badge when stat increases from quest completion (Micro animation, `xpFloat` keyframe)
- Progress bar width: `Math.min(value, 100)%` (max 100 for display)
- Threshold markers: subtle ticks at 15, 20, 25 showing next milestone

##### Option 3: Stat Chips Row (Ultra Compact)

```
[⚔14] [◈11] [◉16] [◆12] [✦8] [★15]  Total: 76
```

- Horizontal row of 6 colored chips
- Each chip: colored border + icon + value
- Tap any chip → expand to mini bar
- Total "Hero Power" shown as aggregate

**Recommendation:** Option 2 (Mini Bars) on dashboard home, Option 1 (Radar Chart) on Hero Card page.

#### Diversification Nudges

Research shows 5 proven patterns to encourage balanced growth:

| Pattern | Implementation | Source |
|---------|---------------|--------|
| **Threshold bonuses** | "Reaching INS 15 unlocks analytical quest types" | Path of Exile stat gating |
| **Balance bonus** | "All attributes ≥ 15 → +5% XP bonus" | Ragnarok Online cross-stat |
| **Visual imbalance** | Lowest stat highlighted in yellow on radar chart | Dark Souls build planners |
| **Cross-stat requirements** | "Boss Quest: needs MAS + RES ≥ 30" | FFXIV gear requirements |
| **Renaissance achievement** | "All attributes above 12 → 'Renaissance Hero' achievement" | Achievement-driven diversification |

#### Quest Completion Integration

After completing a quest:
1. Float "+2 MAS" text in violet, rising from quest card (Micro tier, `xpFloat`)
2. Mini radar chart pulse-expands on the MAS axis (200ms)
3. If crossing threshold → Meso celebration: "MAS reached 15! Tier II quests available!"
4. If approaching balance → "All stats above 12! Renaissance achievement in sight"

---

### Part B: "Add Parallel Skill" Flow

#### The Core Mechanic

When user clicks "Explore a new domain →" (from attribute nudge, or "+" button on attribute widget):

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  🗺️ Expand Your Skill Tree                      │
│                                                  │
│  Your current path: AI & Machine Learning        │
│  [Radar chart showing current attributes]        │
│                                                  │
│  Complementary domains that boost your weaker    │
│  attributes:                                     │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 📊 Data Engineering           VER +3     │   │
│  │ Boost Versatility & Discovery            │   │
│  │ 12 milestones · ~6 weeks                 │   │
│  │ [Start This Path →]                      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 🤝 Leadership & Communication  INF +4    │   │
│  │ Boost Influence & Resilience             │   │
│  │ 8 milestones · ~4 weeks                  │   │
│  │ [Start This Path →]                      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ ✏️ Custom Goal                            │   │
│  │ Define your own learning objective       │   │
│  │ [Set My Goals →]                         │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Flow after selection:**
1. User picks a domain → **mini-onboarding** for that domain only:
   - Interest confirmation (1 screen)
   - Skill assessment for new domain (1 screen)
   - Timeline allocation (how many minutes/day for this track)
2. AI generates roadmap for new domain
3. New roadmap appears as **parallel track** on dashboard (tab or toggle)
4. Daily quests now include mix from both roadmaps
5. Equipment from new domain becomes available (Phase 5F)

**NOT re-onboarding:** Character stays, archetype stays, XP/level/streak carry over. Only new goals + assessment.

---

### Part C: Premium Upsell for Parallel Skills

#### Tiered Access

| Feature | Free Tier | Premium Tier |
|---------|----------|-------------|
| Active roadmaps | 1 | Up to 3 |
| Attribute growth | Only from primary domain quests | From all domain quests |
| Domain-specific equipment | Locked (visible, greyed) | Unlocked |
| AI domain recommendations | See suggestions | Actually start them |
| Balance XP bonus | Not available | +5% for balanced attributes |

#### Free Tier Upsell UX — "Aspirational Visibility" Pattern

Based on Grammarly + Genshin + Canva best practices:

```
┌─────────────────────────────────────────────────┐
│ ⚔ MAS 14  ████████░░ │ ◈ INS 11  ██████░░░░   │
│ ◉ INF 16  ██████████ │ ◆ RES 12  ████████░░   │
│ ✦ VER  8  ████░░░░░░ │ ★ DIS 10  █████░░░░░   │
│                                                  │
│ ✦ Your Versatility is growing slowly.            │
│   Heroes who train multiple domains grow 2.5x    │
│   faster across ALL attributes.                  │
│                                                  │
│ 🔒 Parallel Skill Tracks — unlock with Premium  │
│                                                  │
│ [Try Premium Free for 7 Days →]                  │
│ Not now                                          │
└─────────────────────────────────────────────────┘
```

#### Upsell Triggers (Contextual, NOT Nagging)

Based on research (Duolingo contextual paywall, Grammarly quantified gap, Headspace timeline trust):

| Trigger | When | What User Sees | Pattern |
|---------|------|----------------|---------|
| **Attribute imbalance** | VER or DIS is 2x lower than highest | "Your VER is your quietest attribute. Premium heroes can train multiple domains" | Grammarly quantified gap |
| **Quest completion** | User completes all daily quests | "Want more? Premium heroes have parallel quest tracks" | Duolingo momentum interrupt |
| **Hero Card view** | User views their attributes | Ghost radar outline showing "potential" shape with parallel skills | Genshin constellation aspiration |
| **Roadmap complete** | User finishes a roadmap (BL-008) | "What's next?" includes premium-gated option C (Alt Skills) | Codecademy Pro badge |
| **Equipment locked** | User sees locked equipment for different domain | "🔒 This equipment requires an active Data Engineering path" | Canva crown icon |

#### 7-Day Free Trial Flow

Based on Headspace timeline trust pattern (highest ethical rating in research):

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  ⚡ Your Premium Quest begins!                   │
│                                                  │
│  ○─────────○──────────○──────────○               │
│  Today    Day 5     Day 12    Day 14             │
│  Start   Check-in  Reminder  First              │
│  Free!   "How's    "Trial    Tribute             │
│           it       ends in   (billing)           │
│           going?"   2 days"                      │
│                                                  │
│  What you get:                                   │
│  ✓ Up to 3 parallel skill tracks                 │
│  ✓ Domain-specific equipment unlocked            │
│  ✓ Balance XP bonus (+5%)                        │
│  ✓ AI domain recommendations                    │
│                                                  │
│  [Start Free Trial →]                            │
│  Not now — continue your current quest           │
│                                                  │
│  ℹ Cancel anytime. We'll remind you on Day 12.  │
└─────────────────────────────────────────────────┘
```

**Key ethical decisions:**
- "Not now" = neutral language (UX-R141), not confirmshaming
- Timeline clearly shows billing date
- "Cancel anytime" prominent
- Day 12 reminder = trust-building (Headspace pattern, converts at +17%)
- RPG framing: "Premium Quest", "First Tribute"

#### What We DON'T Do (Anti-Patterns from Research)

| Anti-Pattern | Source | Why We Avoid |
|-------------|--------|-------------|
| Energy depletion mid-quest | Duolingo 2025 | Punishes all users equally — extractive, not motivating |
| Hidden free content | Calm | Destroys trust, makes free tier feel worthless |
| Frustration-triggered offers | Raid Shadow Legends | Monetizing failure = manipulative |
| Invest-then-gate | Intercom | Letting users do work before revealing paywall = bait-and-switch |
| Infinite power ceiling | Diablo Immortal | $500K to max = predatory |
| Streak punishment paywall | (generic) | "Pay to repair streak" = guilt trip (violates UX-R103) |

#### What We DO Copy (Ethical Patterns)

| Pattern | Source | Our Implementation |
|---------|--------|--------------------|
| **Quantified gap** | Grammarly | "7 more attribute points available with parallel skills" |
| **Crown/badge system** | Canva | Consistent 🔒 icon on premium-gated features |
| **Timeline trust** | Headspace | Visual billing timeline on trial offer |
| **Aspirational visibility** | Genshin | Ghost outline on radar chart showing "potential" |
| **Contextual relevance** | Duolingo | Paywall message changes based on trigger context |
| **Battle Pass dual track** | Fortnite/Genshin | Free and premium rewards visible side-by-side |

---

### Conversion Benchmarks (from research)

| Metric | Value | Source |
|--------|-------|--------|
| Freemium-to-paid average | 2-5% | Industry |
| Top-performing freemium | 6-8% | Userpilot |
| Opt-out trial (card required) | 49-60% conversion | Adapty |
| Opt-in trial (no card upfront) | 18-25% conversion | Adapty |
| Loss aversion (trial expiring) | 17% of all conversions | Adapty |
| Tailored paywalls vs generic | +15% conversion | RevenueCat |
| Duolingo subscription share | 85% of revenue | Motley Fool 2025 |

---

### Open Questions

| # | Питання | Варіанти | Impact |
|---|---------|----------|--------|
| Q1 | Attribute display on dashboard: radar chart vs mini bars vs chips? | Radar (rich) / Bars (balanced) / Chips (compact) | UI real estate, cognitive load |
| Q2 | How many parallel skill tracks for premium? | 2 / 3 / unlimited | Balance, server cost |
| Q3 | Does adding a parallel skill = full mini-onboarding or just domain pick? | Full (assessment + timeline) / Quick (domain + auto-assessment) | UX friction vs quality |
| Q4 | Free trial: 7 days or 14 days? | 7 (faster decision) / 14 (more habit formation) | Conversion rate vs cost |
| Q5 | Does free tier see ANY attribute growth from reviews? | Yes (slow growth) / No (zero growth, premium only) | Ethical, value perception |
| Q6 | Attribute threshold bonuses — real gameplay impact or cosmetic? | Real (unlock quest types) / Cosmetic (badges only) | Complexity, balance |
| Q7 | When to show first upsell? | After first roadmap week / After first attribute imbalance / After all daily quests done | Timing sensitivity |
| Q8 | Credit card required for trial? | Opt-in (no card, 18-25% convert) / Opt-out (card, 49-60% convert) | Revenue vs trust |

### Ethical Constraints (BLOCKER)

- **Complete Free Tier** — 1 roadmap with full content, real progress, real attribute growth from primary domain
- **No artificial limitation** — free tier attributes grow naturally; premium = MORE dimensions, not faster growth
- **Neutral decline** — "Not now" everywhere, NEVER confirmshaming
- **Cancel = Subscribe parity** — cancel button equally visible (UX-R164)
- **No streak punishment** — NEVER "subscribe to repair streak"
- **Transparent billing** — visual timeline, Day 12 reminder, clear pricing
- **No attribute pay-to-win** — premium = more sources, not higher caps

### Discovery Deliverables

- [ ] Choose attribute display format (radar/bars/chips) — mockup all 3
- [ ] Design "Explore new domain" flow (mini-onboarding UX)
- [ ] Design premium upsell card for dashboard (contextual variants)
- [ ] Design 7-day trial flow (timeline, onboarding, cancellation)
- [ ] Define attribute threshold system (what unlocks at 15, 20, 25)
- [ ] Define domain adjacency algorithm (which domains complement which)
- [ ] Prototype radar chart SVG component (inline styles, responsive)
- [ ] Define daily quest allocation for parallel tracks (split or additive?)
- [ ] Test attribute nudge copy (A/B: "quietest attribute" vs "growth opportunity")

### Dependencies

- **Phase 5F** — Equipment system (domain-specific equipment)
- **Phase 7** — Subscription tiers (free vs premium definition)
- **BL-004** — Dashboard right sidebar (attribute widget placement)
- **BL-008** — Roadmap completion (Option C: Alt Skills connects to this)

---

---

## BL-010: Social Mini-Game "Skill Clash" — Retention Mechanic — Discovery

**Priority:** P1 (Discovery)
**Status:** NEEDS DISCOVERY + ETHICAL REVIEW — не імплементувати без рішень
**Affects:** New module (game server, game UI, matchmaking)
**UX Rules:** UX-R162 (opt-in social), UX-R164 (interruptible), UX-R103 (no guilt), UX-R141 (positive framing)
**Cross-ref:** Phase 6 (Social & Competitive), GDPR_SOCIAL_FEATURES_COMPLIANCE.md
**GDPR Status:** 🟡 WITH CONSTRAINTS (multiplayer = social feature, requires consent toggle, pseudonyms, age gate)

### Problem

Коли юзер витрачає всі energy crystals — він закриває аппку. Dead-end. Немає причини залишатись на платформі. Це retention leak, особливо для free tier юзерів.

**Гіпотеза:** Якщо дати юзеру простий, соціальний спосіб "залишитись" на платформі (міні-гра з іншими юзерами), це:
1. Збільшить session duration
2. Створить daily habit loop (прийшов вчитись → витратив кристали → пограв → заробив кристали → продовжив вчитись)
3. Обєднає юзерів різного віку/статусу/професії через universal game mechanic

### Research Summary — What Works and What Doesn't

#### Platforms that succeeded with embedded games

| Platform | Game Type | Metrics | Why It Works |
|----------|-----------|---------|-------------|
| **LinkedIn** | 5 daily puzzles (solo + social compare) | **84% D1 return, 80% D7 return** | Quick, daily, social comparison, creates entry point |
| **WeChat** | 500+ mini-games | **500M MAU**, 65% players 30+, top games 70% retention | Cross-demographic, no install, social sharing |
| **Duolingo** | Gamified core product + social quests | **4.5x DAU growth**, social users **5.6x** course completion | Game IS the learning, not separate |
| **Discord** | Activities (games in voice channels) | **93% users** game, 2B hours/month | Platform IS social, games add layer |

#### Platforms that FAILED with games

| Platform | What Happened | Why It Failed |
|----------|-------------|---------------|
| **Snapchat** | 30M MAU games, **shut down 2023** | Games didn't drive messaging/AR/revenue — disconnected from core |
| **Zynga/Facebook** | 83M MAU FarmVille, **spam degraded platform** | Aggressive viral tactics ruined core social experience |
| **Google Stadia** | Entire platform shut down | Solved tech problem users didn't have, identity confusion |
| **Apple Arcade** | 250+ games, **high churn** | Narrative games → binge → cancel. No retention loop |

#### The Critical Lesson

> **Games work for retention ONLY when tightly integrated with the core product. Disconnected entertainment becomes a cost center.**

### Legal Analysis: UNO-like Card Game

**UNO IP Analysis:**

| IP Type | Protected | NOT Protected |
|---------|-----------|---------------|
| Trademark | "UNO" name, logo, specific card art | Game mechanics, rules |
| Copyright | Card artwork, instruction text | Methods of play (US Copyright Office: explicit exclusion) |
| Trade Dress | Red/blue/green/yellow layout | Generic color-matching concept |

**Public Domain Foundation:**
```
Mau-Mau (Germany, ~1930s, public domain)
  └─ Crazy Eights (American, public domain)
       ├─ UNO (Mattel 1971, trademarked NAME only)
       ├─ Switch (British, public domain)
       ├─ Pesten (Dutch, public domain)
       └─ "Skill Clash" (Plan2Skill, original name + art)
```

**Legal precedent:** Mattel won $425K against **counterfeiters** who copied the UNO name/logo/art. They have **NOT sued** games that use Crazy Eights mechanics with different branding. **Game rules are not copyrightable.**

**Safe Implementation:**
- Use own name: **"Skill Clash"** (or "Quest Cards" / "Element Duel" / "Arcane Match")
- Use Plan2Skill's color palette (violet, cyan, rose, gold) NOT UNO's (red, blue, green, yellow)
- Design original card art using pixel art engine
- Frame in RPG vocabulary: "Spell Cards", "Element Match", "Cast a Skill"
- NEVER reference UNO in code, UI, or marketing

### Game Design: "Skill Clash"

#### Core Mechanics (Crazy Eights variant, public domain)

```
Match by COLOR (4 elements: ⚔Violet, ◈Cyan, ◉Rose, ★Gold)
  or NUMBER (1-9)
  or PLAY SPELL CARD

Spell Cards:
  ↻ Reverse (reverse play order)
  ⊘ Skip (skip next player)
  +2 Draw Two (next player draws 2)
  🌀 Wild (choose element color)
  🌀+4 Wild Draw Four (choose element + draw 4)
  ⚡ Skill Burst (play 2 cards at once — unique to Skill Clash)

Win: First to empty hand
Call: "Clash!" when 1 card left (like "UNO!" but our brand)
```

#### RPG Integration (What Makes It NOT Just a Card Game)

| Feature | How It Connects to Learning |
|---------|---------------------------|
| **Crystal reward** | Win = +2 crystals, Play = +1 crystal (regardless of win/loss) |
| **Attribute XP** | Each game awards micro-XP to a random attribute (+1 VER or +1 DIS) |
| **Character avatar** | Your pixel art character appears at the table |
| **Equipment bonus** | Equipped items affect card game: e.g., "Insight Helm" lets you peek at draw pile once |
| **Domain cards** | Special cards themed to your active domain (e.g., AI domain = "Neural Network" = +3) |
| **Post-game nudge** | After game: "Crystals recharged! Ready for your next quest?" with CTA |

#### Why Card Games Cross Demographics

Research confirms:
- **Language-independent**: Colors + numbers = universally understood
- **Low cognitive barrier**: Rules explained in 30 seconds
- **Cultural universality**: Every culture has card games
- **Short sessions**: 5-10 minutes per round
- **Age-neutral**: WeChat data: **65% of mini-game players are 30+**, 50/50 gender
- **Status equalizer**: CEO and intern play the same cards

### Architecture

#### Server Architecture (Low Cost)

```
Client (Next.js) ──WebSocket──> Game Server (Node.js / CF Durable Objects)
                                    │
                                    ├── Room Manager (in-memory / Redis)
                                    │   └── Rooms: 2-4 players, 5-min max
                                    │
                                    ├── Matchmaking (skill-based or random)
                                    └── PostgreSQL (match results, XP awards)
```

**Recommended:** Cloudflare Durable Objects + Hibernatable WebSockets

| Scale | Monthly Cost |
|-------|-------------|
| 100 concurrent game players | **~$5/mo** |
| 1000 concurrent | **~$20/mo** |
| 5000 concurrent | **~$50/mo** → migrate to self-hosted |

**Why so cheap:** Turn-based card games send ~1 message per 5-15 seconds per player. WebSocket Hibernation API reduces cost by **1000x** (bills CPU only when processing messages, not idle connections).

### 10 Critical Constraints (Non-Negotiable)

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **Max 3 games per day** | Session limiting, prevent addiction |
| 2 | **Crystal reward feeds into learning** | Virtuous cycle, not dead-end |
| 3 | **Predefined chat only** | GDPR — no PII exchange |
| 4 | **Pseudonymous opponents** | "Kofi Lv.12", never real names |
| 5 | **16+ age gate** | GDPR social feature requirement |
| 6 | **Opt-in toggle** (OFF by default) | Private by Default (Art. 25) |
| 7 | **5-minute max game length** | Prevent time sink |
| 8 | **No separate push notifications** | No spam, no Zynga pattern |
| 9 | **Available ONLY when crystals depleted** | Positioned as "break", not "alternative" |
| 10 | **XP from game < XP from quests** | Learning = primary, game = secondary |

### GDPR Compliance

| Data | Legal Basis | Retention |
|------|-------------|-----------|
| Match results (win/loss/XP) | Legitimate interest | 30 days |
| In-game actions (card plays) | Not stored post-match | Match duration only |
| Matchmaking (opponent pairing) | Consent (opt-in) | Match duration only |
| Game statistics (win rate) | Legitimate interest | Until account deletion |
| Chat messages | Not stored (predefined phrases) | N/A |
| Account deletion | Anonymize: "A former hero" | 30 days |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Feature creep** — game becomes a separate product | HIGH | Strict scope: 1 game mode, 2-4 players, 5-min rounds. No expansion without discovery |
| **Cannibalization** — users play game instead of learning | HIGH | XP from game < quests. Game only when crystals = 0. Post-game nudge to quests |
| **"Not serious"** perception | MEDIUM | RPG framing. Game = "Social Quest Arena" not "mini-game". Same visual language as learning |
| **Gambling associations** | MEDIUM | No real-money purchases on random outcomes. Deterministic rewards. Card draws = same as any card game |
| **Server cost spike** | LOW | Durable Objects + hibernation = $5-50/mo at early scale |
| **Spam / notifications** | LOW | No push notifications for games. Only in-app when crystals depleted |
| **Addiction** | LOW | 3 games/day limit, 5-min max, cooldown, Quiet Mode integration |

### Alternative to Building: LinkedIn Model (Solo Daily Puzzle)

Before committing to multiplayer card game, consider the **LinkedIn model** — a simpler alternative:

| LinkedIn Model | Card Game Model |
|---------------|----------------|
| Solo puzzle, daily, 2 minutes | Multiplayer, 5 minutes, 3x/day |
| No server cost (client-side) | WebSocket server needed |
| No GDPR social concerns | Full GDPR social compliance needed |
| Social comparison via leaderboard | Direct player interaction |
| LinkedIn: 84% D1 return | WeChat card games: 40-70% retention |
| Zero engineering risk | Moderate engineering risk |

**Solo puzzle examples for Plan2Skill:**
- Daily word match (skill vocabulary)
- Daily logic puzzle (domain-themed)
- Daily pattern recognition

**Recommendation:** Start with **Solo Daily Puzzle** (Phase 6A, low risk), then add **Skill Clash** (Phase 6B, higher risk) if solo puzzle validates the retention hypothesis.

### Open Questions

| # | Питання | Варіанти | Impact |
|---|---------|----------|--------|
| Q1 | Solo daily puzzle first, or jump to multiplayer? | Solo (safer) / Multiplayer (bigger impact) / Both | Engineering scope, GDPR |
| Q2 | Crystal reward per game: how many? | 1 / 2 / 3 | Economy balance, prevents grind |
| Q3 | Game available always or only when crystals = 0? | Always (engagement) / Only at 0 (break mechanic) | Product positioning |
| Q4 | Equipment bonuses in card game: real or cosmetic? | Real (strategic depth) / Cosmetic (pixel art at table) | P2W risk |
| Q5 | AI opponents (vs bots) or human only? | Both / Human only / AI fallback when no opponents | Server cost, UX |
| Q6 | Game name: "Skill Clash" / "Quest Cards" / "Arcane Match" / other? | Brand identity | Marketing |
| Q7 | Leaderboard: games won or separate skill rating? | Wins / Elo rating / None | Competitiveness vs inclusivity |
| Q8 | How to prevent game from attracting "gamers-only" users? | Game requires active roadmap to play / Crystal gate / Level gate | User segmentation |

### Ethical Constraints (BLOCKER)

- **No gambling mechanics** — deterministic rewards, no random drops from matches
- **No real-money purchases** connected to game outcomes
- **Session limiting** — max 3 games/day, 5 min each
- **Quiet Mode** integration — game disabled when quiet mode ON
- **No addiction loops** — no autoplay, no "just one more" dark patterns
- **Post-game nudge** = always towards learning, NEVER "play again"
- **Age gate** — 16+ for multiplayer (GDPR)
- **No push notifications** for game
- **Predefined chat only** — no free text, no PII

### Discovery Deliverables

- [ ] Validate retention hypothesis: survey/interview current users about "what do you do when crystals run out?"
- [ ] Solo daily puzzle prototype (Phase 6A candidate)
- [ ] Multiplayer card game prototype (Phase 6B candidate)
- [ ] Server architecture POC (Cloudflare Durable Objects)
- [ ] Card art design (pixel art, 4 element colors + 6 spell types)
- [ ] Economy balance model: crystal earn rate from games vs quest usage rate
- [ ] GDPR DPIA for multiplayer game feature
- [ ] A/B test: game at crystal=0 vs game always available
- [ ] User perception test: "does a card game make the app feel less serious?"

### Dependencies

- **Phase 5F** — Equipment system (for equipment bonuses in game)
- **Phase 6** — Social & Competitive (card game = social feature)
- **GDPR DPIA** — Required before any multiplayer implementation
- **Consent toggle infrastructure** — separate toggle for "multiplayer games"

---

*More backlog items will be added as they're identified.*

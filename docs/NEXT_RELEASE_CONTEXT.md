# Plan2Skill — Next Release Context Briefing

**Date:** 2026-03-02
**For:** Implementation agent (next session)
**Prepared by:** Previous research/backlog session

---

## 1. ОБОВ'ЯЗКОВО ПРОЧИТАЙ ПЕРЕД БУДЬ-ЯКИМ КОДОМ

### Source of Truth Documents (в порядку пріоритету)

| # | Файл | Що містить |
|---|------|-----------|
| 1 | `Designs/CLAUDE.md` | **12-кроковий чеклист** — токени, inline styles, RPG vocabulary, GDPR, data architecture. БІБЛІЯ АГЕНТА |
| 2 | `Designs/plan2skill/UX_RULES.md` | 166 UX-правил (UX-R001 — UX-R166) |
| 3 | `Designs/plan2skill/src/pages/Plan2Skill-DesignSystem-v7-GenZ-Millennials.jsx` | Стайлгайд v8 — токени (рядки 68-210), персонажі (рядки 2815-2835), анімації |
| 4 | `docs/BACKLOG_DASHBOARD_UX.md` | Беклог BL-001 — BL-010 з повними специфікаціями |
| 5 | `Designs/plan2skill/EQUIPMENT_LOOT_SPEC.md` | Phase 5F spec — equipment, loot, forge, coin economy, XState |
| 6 | `Designs/plan2skill/ENGAGEMENT_FRAMEWORK_ARCHITECTURE.md` | Master architecture doc |
| 7 | `Designs/plan2skill/DATA_ARCHITECTURE_V2.md` | Data platform bible (25 секцій) |

---

## 2. ПОТОЧНИЙ СТАН ПРОЕКТУ

### Що ЗРОБЛЕНО (Phases 5A–5E)

| Phase | Назва | Ключові deliverables |
|-------|-------|---------------------|
| 5A | Core Persistence | tRPC API, JWT auth, streak state machine (`active→at_risk→frozen→broken`), server-side XP/streak, energy crystals |
| 5B | Component Architecture | Dashboard refactor, QuestError, SocialCards, AchievementToast, Zustand hydration fix |
| 5C | Quest Engine v2 | Daily quest allocation, 6 quest types, validation modules, XP caps |
| 5D | Spaced Repetition | SM-2 algorithm, MasteryRing SVG, 4 tRPC endpoints (`review.due/submit/mastery/create`), auto-seeding |
| 5E | Achievement System | 28 achievements (6 categories), AchievementBadge, WeeklyChallenges, 4 tRPC endpoints |

### Що ГОТОВО до імплементації (Phase 5F — SPEC READY)

**Equipment & Loot System** — `EQUIPMENT_LOOT_SPEC.md` (16 секцій + §17 XState):
- ~50 equipment items, 7 slots, 5 rarities
- Loot drops (weighted random), Forge (3→1 merge), Coin economy
- 9 нових tRPC endpoints
- XState v5 для UI flows (loot reveal, forge, equip, shop)
- Prisma models ALREADY in schema: `EquipmentCatalog`, `InventoryItem`, `ForgeHistory`
- Attribute computation: base 10 + equipped item bonuses
- **Estimated timeline:** 6 weeks

---

## 3. БЕКЛОГ DASHBOARD UX (BL-001 — BL-010)

### Пріоритети

| Priority | Items | Опис |
|----------|-------|------|
| **P0** | BL-004, BL-006, BL-007, BL-008, BL-009 | Архітектурні рішення, потребують discovery/design |
| **P1** | BL-001, BL-003, BL-005, BL-010 | UI покращення, можна імплементувати після P0 рішень |
| **P2** | BL-002 | Залежить від Phase 6 (Social) |

### Короткий опис кожного айтему

**BL-001: Dynamic Welcome Greeting** (P1)
- Проблема: перший візит після онбордінгу показує "Welcome back" замість "Your adventure begins"
- Рішення: двовимірна логіка (user state × absence), `isFirstVisit` flag
- Файли: `WelcomeBack.tsx`, `home/page.tsx`
- Складність: LOW — чисто клієнтська зміна

**BL-002: Weekly League Sidebar Widget** (P2)
- Компактний league widget в лівий сайдбар, під іменем юзера
- Блокер: Phase 6 (Social & Competitive)

**BL-003: QuestCardModal Two-Column Desktop** (P1)
- Проблема: modal 440px на desktop = wasted space, контент прихований в accordions
- Рішення: 820px two-column на desktop (left=learning, right=interactive), single-column на mobile
- Файли: `QuestCardModal.tsx` (999 рядків)
- Складність: MEDIUM

**BL-004: Dashboard Layout Refactor — Right Sidebar** (P0)
- Проблема: 8 секцій в main content, Daily Quests = #8 (primary action buried)
- Рішення: 3-zone layout (left nav + main + right sidebar). Main → 4 секції, right sidebar → Weekly Challenges, Mastery, Social, League
- Файли: `layout.tsx`, `home/page.tsx`, sidebar components
- Складність: HIGH — архітектурний refactor
- Benchmark: Duolingo desktop pattern

**BL-005: Weekly Quests UI Redesign** (P1, blocked by BL-004)
- Type-specific icons, difficulty double-coding, reward preview, timer urgency, compact mode for sidebar
- Файли: `WeeklyChallenges.tsx`
- Складність: MEDIUM

**BL-006: Post-Daily-Quest Completion Flow** (P0 Discovery)
- Що відбувається коли всі daily quests виконані? Free: reviews + roadmap preview. Premium: bonus quests + roadmap advance
- Status: DISCOVERY — 7 open questions потребують відповідей
- Залежності: Phase 7 (subscription tiers)

**BL-007: Interactive Roadmap Visualization** (P0 Discovery)
- Проблема: roadmap = статичний hardcoded timeline
- 4 варіанти layout: horizontal trophy shelf / vertical winding / mountain climb / board game
- Status: DISCOVERY — 8 open questions

**BL-008: Roadmap Completion & Next Journey** (P0 Discovery)
- Проблема: юзер завершив roadmap = dead-end
- 3 фази: celebration → trophy claim → 4 варіанти next journey (AI roadmap / custom goals / alt skills / trending)
- GDPR: trending = anonymized aggregation (min 50 per group)
- Status: DISCOVERY

**BL-009: Hero Attributes on Dashboard + Parallel Skills Upsell** (P0 Discovery)
- 3 частини: A) attributes widget на dashboard (mini bars / radar chart), B) "add parallel skill" flow (mini-onboarding), C) premium upsell (free=1 roadmap, premium=3)
- Атрибути: MAS/INS/INF/RES/VER/DIS — інфраструктура ВCILYA є (types, DB, service, store), але UI hardcoded на 10
- Upsell patterns: Grammarly quantified gap, Headspace timeline trust, Canva crown icon
- 7-day free trial з RPG framing
- Status: DISCOVERY

**BL-010: Social Mini-Game "Skill Clash"** (P1 Discovery)
- Card game (Crazy Eights = public domain) для retention коли crystals = 0
- Server: Cloudflare Durable Objects, $5-50/month
- 10 non-negotiable rules (3 games/day, 5min max, opt-in, 16+, pseudo names)
- Рекомендація: Phase 6A = solo daily puzzle (LinkedIn model), Phase 6B = multiplayer card game
- GDPR: social feature, requires consent toggle
- Status: DISCOVERY

---

## 4. АРХІТЕКТУРА

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 |
| State | Zustand (persist middleware, `onRehydrateStorage` hydration tracking) |
| API Client | tRPC + `@plan2skill/api-client` |
| Backend | NestJS 11 + tRPC |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| AI | Claude API (roadmap generation, quest content) |
| Styling | **Inline styles ONLY** (no Tailwind for visual) |

### Ports (КОНСТИТУЦІЯ)

| Port | Service | Note |
|------|---------|------|
| **3500** | Next.js web | Plan2Skill dev server |
| **4000** | NestJS API | Plan2Skill API |
| **3000** | **ЗАЙНЯТИЙ** | **НІКОЛИ НЕ ЧІПАТИ!** |
| **5433** | **ЗАЙНЯТИЙ** | **НІКОЛИ НЕ ЧІПАТИ!** |

### File Map

```
plan2skill/
├── apps/
│   ├── web/                          ← Next.js 15
│   │   ├── app/
│   │   │   ├── (auth)/login/         ← Login page
│   │   │   ├── (onboarding)/         ← v2 onboarding (9 pages)
│   │   │   │   ├── intent/           ← Step 1: WHO I AM
│   │   │   │   ├── goal/             ← Step 2: WHERE I WANT TO BE (direct|guided|career)
│   │   │   │   ├── assessment/       ← Step 3: Skill Assessment
│   │   │   │   ├── character/        ← Step 4: Pixel art selection
│   │   │   │   ├── first-quest/      ← Step 5: Quiz + equipment
│   │   │   │   └── layout.tsx        ← Shared layout, keyframes, ambient glows
│   │   │   ├── (dashboard)/          ← Main app
│   │   │   │   ├── layout.tsx        ← Dashboard layout (left sidebar, hydration guard)
│   │   │   │   ├── home/page.tsx     ← Command Center (8 sections, needs BL-004 refactor)
│   │   │   │   ├── home/_components/ ← 12 components + 5 hooks + data + utils
│   │   │   │   ├── hero-card/        ← Hero profile (attributes, equipment, stats)
│   │   │   │   ├── roadmap/          ← Roadmap view (hardcoded phases, needs BL-007)
│   │   │   │   └── league/           ← Leaderboard page
│   │   │   └── (admin)/              ← Admin panel (9 pages, role-based)
│   │   └── providers.tsx             ← tRPC + auth providers
│   │
│   └── api/                          ← NestJS 11
│       ├── prisma/schema.prisma      ← 17 models (ODS layer)
│       └── src/
│           ├── achievement/          ← Phase 5E
│           ├── ai/                   ← Claude API integration
│           ├── auth/                 ← JWT strategy
│           ├── character/            ← Character + attributes + equipment
│           ├── quest/                ← Quest allocation + validation
│           ├── progression/          ← XP, streak, energy
│           ├── roadmap/              ← CRUD + AI generation
│           ├── spaced-repetition/    ← Phase 5D, SM-2
│           ├── trpc/trpc.router.ts   ← All tRPC endpoints (6 routers, 22 endpoints)
│           └── user/                 ← Profile, preferences
│
├── packages/
│   ├── types/src/                    ← Shared TypeScript types (8 files)
│   ├── store/src/                    ← Zustand stores (7 files)
│   │   ├── auth.store.ts
│   │   ├── character.store.ts        ← attributes: Record<AttributeKey, number>
│   │   ├── progression.store.ts      ← XP, level, streak, energyCrystals
│   │   ├── roadmap.store.ts
│   │   ├── onboarding.store.ts       ← v1 (legacy, kept for dashboard compat)
│   │   ├── onboarding-v2.store.ts    ← v2 (current flow)
│   │   └── level-utils.ts            ← CANONICAL: xpForLevel(n) = 80 + 20*n
│   ├── ui/src/
│   │   ├── tokens/gamification.ts    ← ATTRIBUTES array, RARITIES, EQUIPMENT_SLOTS
│   │   ├── tokens/colors.ts          ← Color tokens
│   │   └── components/PixelCanvas.tsx
│   └── api-client/src/               ← tRPC client + React provider
│
├── docs/
│   └── BACKLOG_DASHBOARD_UX.md       ← 10 backlog items (BL-001—BL-010)
│
└── Designs/plan2skill/               ← Design specs (OUTSIDE git repo)
    ├── CLAUDE.md                     ← Agent implementation rules
    ├── UX_RULES.md                   ← 166 UX rules
    ├── EQUIPMENT_LOOT_SPEC.md        ← Phase 5F spec
    ├── ENGAGEMENT_FRAMEWORK_ARCHITECTURE.md
    ├── DATA_ARCHITECTURE_V2.md
    ├── BACKLOG_DASHBOARD_UX.md       ← Source copy (kept in sync with docs/)
    └── src/pages/Plan2Skill-DesignSystem-v7-GenZ-Millennials.jsx
```

### tRPC Endpoints (22 total, 6 routers)

```
user.profile              [QUERY]
user.updateDisplayName    [MUTATION]
user.completeOnboarding   [MUTATION]
user.updatePreferences    [MUTATION]

character.get             [QUERY]
character.create          [MUTATION]

roadmap.list              [QUERY]
roadmap.get               [QUERY]
roadmap.generate          [MUTATION]

progression.getProfile    [QUERY]
progression.completeTask  [MUTATION]
progression.rechargeEnergy [MUTATION]

quest.daily               [QUERY]
quest.validate            [MUTATION]

review.due                [QUERY]
review.submit             [MUTATION]
review.mastery            [QUERY]
review.create             [MUTATION]

achievement.list          [QUERY]
achievement.unlock        [MUTATION]
achievement.sync          [MUTATION]
achievement.weeklyChallenges [QUERY]
```

### Prisma Models (17)

```
User, RefreshToken, Character, CharacterEquipment,
EquipmentCatalog, InventoryItem, ForgeHistory,
Roadmap, Milestone, Task,
UserProgression, Streak, XPEvent, QuestCompletion,
ReviewItem, AchievementUnlock, WeeklyChallenge
```

### Hero Attributes System (existing infrastructure)

```typescript
// packages/types/src/enums.ts
type AttributeKey = 'MAS' | 'INS' | 'INF' | 'RES' | 'VER' | 'DIS';

// packages/ui/src/tokens/gamification.ts
ATTRIBUTES = [
  { key: 'MAS', fullName: 'Mastery',     icon: '⚔', color: '#9D7AFF' },
  { key: 'INS', fullName: 'Insight',     icon: '◈', color: '#3B82F6' },
  { key: 'INF', fullName: 'Influence',   icon: '◉', color: '#FF6B8A' },
  { key: 'RES', fullName: 'Resilience',  icon: '◆', color: '#6EE7B7' },
  { key: 'VER', fullName: 'Versatility', icon: '✦', color: '#4ECDC4' },
  { key: 'DIS', fullName: 'Discovery',   icon: '★', color: '#FFD166' },
];

// DB: Character model has mastery, insight, influence, resilience, versatility, discovery (Int, default 0)
// Service: character.service.ts — createCharacter (init to 10), addAttribute, checkEvolution
// Store: character.store.ts — attributes: Record<AttributeKey, number>, updateAttributes()
// UI: hero-card/page.tsx — hardcoded to 10, TODO Phase 5F
// Evolution tiers: novice (0-79) → apprentice (80-179) → practitioner (180-299) → master (300+)
```

### Zustand Hydration Pattern (IMPORTANT)

```typescript
// Both onboarding stores use onRehydrateStorage:
let _v1Hydrated = false;
export function isOnboardingV1Hydrated() { return _v1Hydrated; }
// persist config: onRehydrateStorage: () => () => { _v1Hydrated = true; }

// Dashboard layout polls hydration before checking onboarding:
const [hydrated, setHydrated] = useState(() => isOnboardingV1Hydrated() && isOnboardingV2Hydrated());
useEffect(() => {
  if (hydrated) return;
  const id = setInterval(() => {
    if (isOnboardingV1Hydrated() && isOnboardingV2Hydrated()) {
      setHydrated(true); clearInterval(id);
    }
  }, 10);
  return () => clearInterval(id);
}, [hydrated]);
```

---

## 5. КЛЮЧОВІ ПРАВИЛА (КОНСТИТУЦІЯ)

1. **Inline styles ONLY** — ніколи Tailwind для visual styling
2. **Токени з `t.*`** — ніколи hardcoded кольори
3. **RPG vocabulary** — Tasks→Quests, Loading→Forging, Error→"The path is blocked"
4. **8 diverse characters** з v7 (aria, kofi, mei, diego, zara, alex, priya, liam) + sage NPC
5. **Gamified components** — QuestPage, QuestList, ForgeAnimation, QuestError, XPProgressBar
6. **Animation tiers** — Micro (150-400ms), Meso (400-1200ms), Macro (1200-3000ms, interruptible)
7. **Level formula CANONICAL** — `xpForLevel(n) = 80 + 20*n`, одна формула скрізь
8. **XP grant via optimistic locking** — `UPDATE SET total_xp = total_xp + $amount RETURNING *`
9. **GDPR** — social features OFF by default, pseudonyms, ephemeral data, no embedded widgets
10. **Ethical** — no guilt trips, neutral decline language, cancel = subscribe parity
11. **Порти** — web=3500, api=4000, **НІКОЛИ** не чіпати 3000/5433

---

## 6. РЕКОМЕНДОВАНИЙ ПОРЯДОК ІМПЛЕМЕНТАЦІЇ

### Sprint 1: Dashboard Refactor (BL-004 + BL-001)
1. **BL-004** — Right sidebar layout (архітектурна основа для всього іншого)
2. **BL-001** — Dynamic welcome greeting (quick win після BL-004)

### Sprint 2: Quest UX (BL-003 + BL-005)
3. **BL-003** — QuestCardModal two-column desktop
4. **BL-005** — Weekly Quests redesign (compact mode for sidebar)

### Sprint 3: Phase 5F — Equipment & Loot
5. Implement EQUIPMENT_LOOT_SPEC.md (9 tRPC endpoints, XState machines, UI components)
6. Wire Hero Card attributes to real computation (base 10 + equipment bonuses)

### Sprint 4: Discovery → Design (BL-006—BL-010)
7. Conduct discovery sessions for BL-006 through BL-010
8. Design mockups, answer open questions
9. Plan Phase 6 implementation based on discovery outcomes

---

## 7. KNOWN ISSUES / TECH DEBT

- `hero-card/page.tsx` lines 227-277: attributes hardcoded to 10 (TODO Phase 5F)
- `roadmap/page.tsx`: hardcoded `PHASES[]` array (needs BL-007 dynamic roadmap)
- `home/page.tsx`: 8 sections stacked vertically (needs BL-004 refactor)
- Onboarding v1 store kept for backward compat (dashboard reads `characterId`, `archetypeId`)
- `QuestCardModal.tsx`: 999 lines, single column 440px (needs BL-003)
- No i18n implemented yet (strings hardcoded in EN, architecture requires ref_translations EAV)

---

## 8. МОВА СПІЛКУВАННЯ

Українська.

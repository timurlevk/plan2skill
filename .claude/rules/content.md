---
paths:
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.ts"
  - "apps/api/prisma/seed-i18n-full.ts"
  - "apps/api/src/i18n/**/*.ts"
  - "apps/api/src/onboarding/**/*.ts"
  - "apps/api/src/ai/core/template.service.ts"
---

# Content & i18n Rules

## Three Content Layers

Every user-facing string belongs to exactly one layer:

| Layer | What | Source | Example |
|-------|------|--------|---------|
| **UI strings** | Static labels, buttons, headings | `useI18nStore` → `tr('key')` | "Choose Your Hero", "Save" |
| **Reference data** | Entity attributes with i18n | `refContent` + `refTranslation` → tRPC | Domain names, archetype taglines, assessment questions |
| **AI-generated** | Personalized dynamic content | AI generators → template fallbacks | Quest descriptions, milestones, motivational messages |

Never hardcode user-facing English text. Every visible string must go through one of these layers.

## UI Strings — `tr()` pattern

```tsx
// Import alongside other stores (merge, don't add separate import)
import { useOnboardingV2Store, useI18nStore } from '@plan2skill/store';

// CRITICAL: name it `tr`, NOT `t` — `t` is design tokens (colors/fonts)
const tr = useI18nStore((s) => s.t);

// Usage
{tr('onboarding.choose_hero')}                              // simple
{tr('herocard.crystals').replace('{n}', String(count))}      // template var
{tr('questmap.count', '{n}/{limit} quest lines')}            // with fallback
```

**Naming convention for keys:**
- `nav.*` — navigation labels
- `action.*` — common actions (start, continue, cancel)
- `onboarding.*` — onboarding flow
- `npc.*` — NPC dialogue bubbles
- `dashboard.*` — home/skills/assessment screens
- `questmap.*` — roadmap/quest line screens
- `forge.*` / `shop.*` / `chronicle.*` — feature screens
- `herocard.*` / `settings.*` — profile screens
- `common.*` — shared (saving, loading, change)
- `achievement.*` — achievement title/desc
- `equipment.*` — equipment slot names
- `template.*` — AI fallback templates
- `error.*` — error states
- `rarity.*` — rarity tier names

## Reference Data — `refContent` + `refTranslation`

Entity data lives in the database, NOT in frontend constants:

```
seed-i18n-full.ts → prisma seed → DB
                                  ↓
              TranslationService (in-memory cache on boot)
                                  ↓
              OnboardingContentService.getIntents(locale)
                                  ↓
              tRPC endpoint → frontend useQuery() → useMemo fallback to MOCK
```

**When adding a new entity type:**
1. Add `RefContentRow[]` array in seed (entityType, entityId, data, sortOrder)
2. Add `TranslationRow[]` array in seed (entityType, entityId, field, en, uk, pl)
3. Include in `ALL_REF_CONTENT` and `ALL_CONTENT_TRANSLATIONS` spreads
4. Add query method in `OnboardingContentService`
5. Add tRPC endpoint
6. Frontend: `useQuery()` with mock fallback via `useMemo`

**Compact trilingual pattern** (for large datasets like assessment questions):
```typescript
const ASSESSMENT_SEED: AssessmentSeedQ[] = [
  { id: 'tech-e1', domain: 'tech', difficulty: 1,
    question: { en: '...', uk: '...', pl: '...' },
    options: [{ id: 'a', text: { en: '...', uk: '...', pl: '...' }, correct: true }],
    npcCorrect: { en: '...', uk: '...', pl: '...' },
    npcWrong: { en: '...', uk: '...', pl: '...' },
  },
];
// Expand with helper: expandAssessmentSeed() → { contentRows, translationRows }
```

## AI-Generated Content — Template Fallbacks

AI generators follow the chain: **LLM call → cache → template fallback → error**.

`TemplateService.getFallback(type, input, locale)` provides locale-aware fallbacks:
- Quest templates → `template.quest_review`, `template.quest_practice`, etc.
- Motivational → `template.motivational_1..5`
- Fun facts → `template.funfact_1..5`

Fallbacks use `TranslationService` to serve localized text. Always pass `locale` from input.

## Seed File — `seed-i18n-full.ts`

Single source of truth for ALL reference + translation data. Structure:

```
Section 1: RefContent rows (INTENTS, DOMAINS, INTERESTS, ..., ASSESSMENT_CONTENT)
Section 2: Content translations (INTENT_TRANSLATIONS, ..., ASSESSMENT_TRANSLATIONS)
Section 3: UI translations (UI_TRANSLATIONS — flat key-value for frontend tr())
Section 4: Seed functions (seedRefContent, seedTranslations, seedUiTranslations)
```

**Rules for adding translations:**
- All 3 locales required: `en`, `uk`, `pl`
- UI keys go in `UI_TRANSLATIONS` array as `{ entityId, en, uk, pl }`
- Content translations go in dedicated `*_TRANSLATIONS` arrays as `{ entityType, entityId, field, en, uk, pl }`
- Run `npx prisma db seed` after changes to populate DB
- Verify with `npx tsc --noEmit -p apps/api/tsconfig.json` — zero errors

## Frontend Constants as Fallbacks

Frontend `_data/*.ts` files (INTENTS, QUESTIONS, ARCHETYPES, etc.) serve as **mock fallbacks** when API is unavailable. The pattern:

```tsx
const { data: apiData } = trpc.onboarding.intents.useQuery({ locale });
const intents = useMemo(() => apiData?.length ? apiData : INTENTS, [apiData]);
```

Do NOT remove frontend constants — they ensure the app works offline/without API.

## CRITICAL: Seed ↔ Frontend Sync

**When changing any entity attribute (routes, icons, colors, sort order, etc.):**
1. Update `seed-i18n-full.ts` (DB source of truth) — this is what the API serves
2. Update matching frontend `_data/*.ts` constant (fallback)
3. Re-run `npx ts-node prisma/seed-i18n-full.ts` to update DB
4. Restart API to refresh the in-memory cache (`OnboardingContentService`)

**API data overrides frontend fallbacks** — if you only change the frontend constant but not the seed, the API will still serve the old value from DB. Both must stay in sync.

## Locales

- Supported: `en` (English), `uk` (Ukrainian), `pl` (Polish)
- Auto-detection: browser language → Russian maps to Ukrainian
- `useLoadTranslations` hook fetches on mount → `useI18nStore.messages`
- `tr()` returns: `messages[key] ?? fallback ?? key` (key itself as last resort)

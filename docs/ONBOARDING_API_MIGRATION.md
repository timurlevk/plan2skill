# Onboarding: Mock Data → API Migration + i18n Wire-up

**Status:** Requirements
**Date:** 2026-03-04

---

## 1. Current State

The onboarding wizard (5 steps) runs **100% on client-side mock data**. ~200 data points hardcoded in `apps/web/app/(onboarding)/_data/*.ts`, stored in localStorage via Zustand. Zero API calls for content — only 3 fire-and-forget mutations (`character.create`, `user.completeOnboarding`, `narrative.completeLegend`).

Translation service exists on backend (`TranslationService`, `i18n.messages` tRPC endpoint, 33 seed entries) but **frontend doesn't consume it** — all text hardcoded in English.

### Mock Data Inventory

| File | Items | Used By |
|------|-------|---------|
| `intents.ts` | 4 intent configs | Step 1: Intent |
| `domains.ts` | 9 domains + 68 interests | Step 2B: Guided |
| `career-data.ts` | 6 pain points + 7 career targets | Step 2C: Career |
| `milestone-templates.ts` | 16 goal templates (3 milestones each) | Step 2A/2B/2C: GoalPyramid |
| `goal-subgoals.ts` | 14 sub-goal presets | Step 2A: Direct |
| `assessment-questions.ts` | 27 adaptive questions + 4 self-assess options | Step 3: Assessment |
| `skill-questions.ts` | 10 goal-specific question sets (3 Qs each) | Step 3: Skills quiz |
| `npc-scripts.ts` | 4 NPC dialogue scripts + 1 fallback | Step 3: NPC reactions |
| `archetypes.ts` | 5 archetype definitions | Step 4: Character |

### Gap Analysis Summary

**Implemented (3/27 = 11%):** RefTranslation model, TranslationService, i18n.messages endpoint, seed-translations.ts (33 keys)

**Partial (2):** LocalePicker (no backend sync), seed-translations.ts (33 of ~450 keys)

**Missing (22):** See Section 12 for full itemized list.

---

## 2. Migration Strategy

### Principle: **Seed DB, serve via API, keep client fallbacks**

Mock data becomes seed data in the database. API serves it. Client keeps a slim fallback for offline/error resilience. This enables:
- Admin-editable content without deploys
- Multi-language support via `ref_translations`
- A/B testing by swapping content sets
- Analytics on which options users pick

### What stays client-side (no migration needed)

| Data | Reason |
|------|--------|
| Pixel art (character sprites, palettes) | Pure rendering, no text content |
| XP values (5/10/15 per step) | Game balance constants, not user-facing text |
| Adaptive assessment algorithm (IRT logic) | Client-side computation, not content |
| Character customization matrices (body/skin/hair/shirt) | Visual options, not translatable text |

---

## 3. New API Endpoints

### 3.1 `onboarding.intents` (public query)

Returns intent options for Step 1.

```typescript
// Response
interface IntentOption {
  id: string;           // 'know' | 'explore_guided' | 'career' | 'exploring'
  title: string;        // translated
  description: string;  // translated
  icon: string;         // NeonIconType
  color: string;
  nextRoute: string;
}
```

**Source:** Seed `ref_content` table with `entityType = 'intent'`.

### 3.2 `onboarding.domains` (public query)

Returns skill domains + interests for Step 2B.

```typescript
// Response
interface DomainWithInterests {
  id: string;
  name: string;         // translated
  description: string;  // translated
  icon: string;
  color: string;
  interests: {
    id: string;
    label: string;      // translated
    icon: string;
    color: string;
    trending: boolean;
  }[];
}
```

**Source:** Seed `ref_content` table with `entityType = 'domain'` and `'interest'`.

### 3.3 `onboarding.careerData` (public query)

Returns pain points + career targets for Step 2C.

```typescript
// Response
interface CareerData {
  painPoints: {
    id: string;
    label: string;      // translated
    icon: string;
    color: string;
  }[];
  careerTargets: {
    id: string;
    name: string;       // translated
    description: string; // translated
    icon: string;
    color: string;
    suggestedDomain: string;
  }[];
}
```

### 3.4 `onboarding.goalTemplates` (public query)

Returns milestone templates for GoalPyramid (Steps 2A/2B/2C).

```typescript
// Input
{ domain?: string; keywords?: string[] }

// Response
interface GoalTemplate {
  id: string;
  domain: string;
  dreamLabel: string;   // translated
  milestones: {
    id: string;
    text: string;       // translated
    weeks: number;
  }[];
}
```

**Note:** Keyword matching moves server-side. Client sends `keywords` from user input, API does fuzzy match + returns best template.

### 3.5 `onboarding.assessmentQuestions` (protected query)

Returns adaptive questions for Step 3.

```typescript
// Input
{ domain: string; difficulty?: number }

// Response
interface AssessmentQuestion {
  id: string;
  domain: string;
  difficulty: 1 | 2 | 3;
  question: string;        // translated
  options: {
    id: string;
    text: string;           // translated
    correct: boolean;
  }[];
  npcReaction: {
    correct: string;        // translated
    wrong: string;          // translated
  };
}
```

**Adaptive logic stays client-side** — client requests by domain+difficulty, selects next difficulty locally based on answers.

### 3.6 `onboarding.archetypes` (public query)

Returns archetype definitions for Step 4.

```typescript
// Response
interface ArchetypeOption {
  id: string;           // 'strategist' | 'explorer' | 'connector' | 'builder' | 'innovator'
  name: string;         // translated
  tagline: string;      // translated
  bestFor: string;      // translated
  icon: string;
  color: string;
  stats: { label: string; value: number }[];
}
```

### 3.7 `onboarding.submitAssessment` (protected mutation) — **NEW**

Currently assessment results stay in localStorage only. This endpoint persists them.

```typescript
// Input
{
  assessments: {
    domain: string;
    level: 'beginner' | 'familiar' | 'intermediate' | 'advanced';
    method: 'quiz' | 'self';
    score: number;
    confidence: number;
  }[];
}

// Effect: Creates/updates SkillElo records, stores raw assessment
```

### 3.8 `onboarding.submitGoal` (protected mutation) — **NEW**

Persists onboarding goal data for roadmap generation.

```typescript
// Input
{
  intent: string;
  path: 'direct' | 'guided' | 'career';
  dreamGoal?: string;
  domain?: string;
  interests?: string[];
  careerTarget?: string;
  milestones: { text: string; weeks: number }[];
}

// Effect: Stores in user profile, used as input for roadmap.generate
```

---

## 4. Database Changes

### 4.1 New model: `RefContent`

Reference content table for admin-editable onboarding data.

```prisma
model RefContent {
  id          String   @id @default(uuid())
  entityType  String   @db.VarChar(30)   // 'intent', 'domain', 'interest', 'pain_point', 'career_target', 'goal_template', 'milestone', 'archetype', 'assessment_question', 'assessment_option', 'npc_reaction'
  entityId    String   @db.VarChar(100)  // e.g. 'know', 'ai', 'tech-e1'
  parentId    String?  @db.VarChar(100)  // e.g. interest→domain, option→question
  data        Json                       // non-translatable fields: icon, color, difficulty, correct, weeks, etc.
  sortOrder   Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([entityType, entityId], name: "uq_ref_content")
  @@index([entityType, active, sortOrder], name: "idx_ref_content_type")
  @@index([entityType, parentId], name: "idx_ref_content_parent")
  @@map("ref_content")
}
```

### 4.2 Translations via existing `RefTranslation`

All translatable text goes into `ref_translations`:

```
entityType = 'intent',   entityId = 'know',     field = 'title',       locale = 'en', value = 'I know what I want'
entityType = 'intent',   entityId = 'know',     field = 'title',       locale = 'uk', value = 'Я знаю, чого хочу'
entityType = 'intent',   entityId = 'know',     field = 'description', locale = 'en', value = 'Jump straight to goal setting'
entityType = 'domain',   entityId = 'ai',       field = 'name',        locale = 'en', value = 'AI & Smart Tools'
entityType = 'domain',   entityId = 'ai',       field = 'name',        locale = 'uk', value = 'AI та розумні інструменти'
entityType = 'question', entityId = 'tech-e1',  field = 'question',    locale = 'en', value = 'What does HTML stand for?'
...
```

### 4.3 New model: `OnboardingSubmission`

Persists onboarding choices for analytics + roadmap input.

```prisma
model OnboardingSubmission {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  intent      String   @db.VarChar(30)
  path        String   @db.VarChar(20)    // direct, guided, career
  dreamGoal   String?  @db.Text
  domain      String?  @db.VarChar(50)
  interests   String[] @default([])
  careerTarget String? @db.VarChar(50)
  milestones  Json     @default("[]")     // [{text, weeks}]
  assessments Json     @default("[]")     // [{domain, level, method, score}]
  locale      String   @default("en") @db.VarChar(10)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("onboarding_submissions")
}
```

---

## 5. i18n Wire-up (Frontend)

### 5.1 Translation hook: `useT()`

```typescript
// packages/store/src/i18n.store.ts
// Fetches translations from trpc.i18n.messages on locale change
// Exposes: t(key) → translated string, locale, setLocale()
```

**Flow:**
1. `LocalePicker` calls `setLocale('uk')`
2. Store fires `trpc.i18n.messages.query({ locale: 'uk' })`
3. Response cached in Zustand: `{ 'nav.home': 'Головна', ... }`
4. `t('nav.home')` → `'Головна'` (fallback to key if missing)

### 5.2 Onboarding content translations

API endpoints return pre-translated content based on user's locale (passed as query param or from JWT). No client-side translation lookup needed for onboarding data — server joins `ref_content` + `ref_translations` and returns localized text.

### 5.3 Locale sync to backend

When user selects locale in `LocalePicker`:
1. Save to `onboarding-v2` store (immediate, local)
2. If authenticated: call `user.updatePreferences({ locale })` (fire-and-forget)
3. Onboarding API queries include `locale` param for unauthenticated users

### 5.4 Translation scope (Phase 1)

| Area | Keys | Priority |
|------|------|----------|
| Onboarding UI (buttons, labels, headers) | ~40 | P0 |
| Intent titles + descriptions | 8 | P0 |
| Domain names + descriptions | 18 | P0 |
| Interest labels | 68 | P0 |
| Career pain points + targets | 13+14 | P0 |
| Assessment questions + options | 27×5 = ~135 | P1 |
| NPC reactions | ~60 | P1 |
| Archetype names + descriptions | 15 | P0 |
| Dashboard UI | ~50 | P1 |
| Error messages | ~15 | P1 |
| **Total** | **~450 keys × 3 locales = ~1350 entries** | |

---

## 6. Seed Script

One-time migration: parse existing `_data/*.ts` files → insert into `ref_content` + `ref_translations` (English). Ukrainian and Polish translations added manually or via AI batch translation.

```bash
npx ts-node apps/api/prisma/seed-onboarding-content.ts
```

---

## 7. Content Service (Backend)

### `OnboardingContentService`

```typescript
@Injectable()
export class OnboardingContentService {
  constructor(
    private prisma: PrismaService,
    private translations: TranslationService,
  ) {}

  // Queries ref_content + joins ref_translations for locale
  async getIntents(locale: string): Promise<IntentOption[]>
  async getDomains(locale: string): Promise<DomainWithInterests[]>
  async getCareerData(locale: string): Promise<CareerData>
  async getGoalTemplates(locale: string, domain?: string, keywords?: string[]): Promise<GoalTemplate[]>
  async getAssessmentQuestions(locale: string, domain: string, difficulty?: number): Promise<AssessmentQuestion[]>
  async getArchetypes(locale: string): Promise<ArchetypeOption[]>

  // Mutations
  async submitAssessment(userId: string, data: AssessmentInput): Promise<void>
  async submitGoal(userId: string, data: GoalInput): Promise<void>
}
```

**Caching:** In-memory warm cache (same pattern as `TranslationService`). Content rarely changes → cache invalidated on admin edit only.

---

## 8. Frontend Migration (Per Page)

### Step 1: Intent (`/intent`)

```diff
- import { INTENTS } from '../_data/intents';
+ const { data: intents } = trpc.onboarding.intents.useQuery({ locale });
+ // Fallback: hardcoded INTENTS if query fails
```

### Step 2B: Guided (`/goal/guided`)

```diff
- import { DOMAINS, getInterestsForDomain } from '../_data/domains';
+ const { data: domains } = trpc.onboarding.domains.useQuery({ locale });
```

### Step 2C: Career (`/goal/career`)

```diff
- import { PAIN_POINTS, CAREER_TARGETS } from '../_data/career-data';
+ const { data: careerData } = trpc.onboarding.careerData.useQuery({ locale });
```

### Step 3: Assessment (`/assessment`)

```diff
- import { QUESTIONS } from '../_data/assessment-questions';
+ const { data: questions } = trpc.onboarding.assessmentQuestions.useQuery({ locale, domain });
```

### Step 4: Character (`/character`)

```diff
- import { ARCHETYPES } from '../_data/archetypes';
+ const { data: archetypes } = trpc.onboarding.archetypes.useQuery({ locale });
```

### All pages: submit onboarding data

```diff
+ // After Step 3 (assessment):
+ trpc.onboarding.submitAssessment.useMutation()
+
+ // After Step 2 (goal):
+ trpc.onboarding.submitGoal.useMutation()
```

---

## 9. Implementation Phases

### Phase O1: Database + Seed (backend)
1. Add `RefContent` + `OnboardingSubmission` to Prisma schema
2. `prisma db push`
3. Write + run seed script (parse mock data → DB)

### Phase O2: Content Service + Endpoints (backend)
4. Create `OnboardingContentService`
5. Add `onboarding.*` tRPC router (8 endpoints)
6. Register in `TrpcModule`

### Phase O3: i18n Hook (frontend)
7. Create `useT()` hook + i18n Zustand store
8. Wire `LocalePicker` → `user.updatePreferences`
9. Add UI translations (buttons, labels) for uk/pl

### Phase O4: Page Migration (frontend)
10. Migrate each page to use API (with fallback to existing mock data)
11. Add `submitAssessment` + `submitGoal` mutations
12. Remove `_data/` imports (keep as fallback constants)

### Phase O5: Content Translations
13. Translate ~450 keys to uk/pl (AI batch + manual review)
14. Seed translations into `ref_translations`

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API latency on onboarding pages | Client-side fallback data; prefetch on route transition |
| Translation quality (AI-generated) | Manual review by native speakers; admin edit UI |
| Breaking existing onboarding flow | Keep mock data as fallback; feature flag `USE_API_CONTENT` |
| Large seed script complexity | One entity type at a time; validate with existing test user |

---

## 11. Success Criteria

- [ ] All onboarding content served from API (with client fallback)
- [ ] LocalePicker changes language of all onboarding text in real-time
- [ ] Assessment results persisted to DB (SkillElo created)
- [ ] Goal data persisted to DB (used as roadmap.generate input)
- [ ] uk/pl translations for P0 content (intents, domains, archetypes)
- [ ] Zero regression: existing onboarding flow works identically
- [ ] Admin can edit content without deploy

---

## 12. Gap Analysis — Missing Items (22)

### 12.1 Database (2 items missing)

| # | Item | Status | What's needed |
|---|------|--------|---------------|
| 1 | `RefContent` model | **MISSING** | Add to `prisma/schema.prisma`: entityType/entityId/parentId/data(Json)/sortOrder/active. Maps to `ref_content`. See Section 4.1 |
| 2 | `OnboardingSubmission` model | **MISSING** | Add to `prisma/schema.prisma`: userId(unique FK)/intent/path/dreamGoal/domain/interests/careerTarget/milestones(Json)/assessments(Json)/locale. Add `onboardingSubmission OnboardingSubmission?` relation on `User` model. See Section 4.3 |

### 12.2 Backend Service + Module (2 items missing)

| # | Item | Status | What's needed |
|---|------|--------|---------------|
| 3 | `OnboardingContentService` | **MISSING** | Create `apps/api/src/onboarding/onboarding-content.service.ts` with 6 query methods + 2 mutation methods. Depends on PrismaService + TranslationService. Uses in-memory warm cache. See Section 7 |
| 4 | `OnboardingModule` | **MISSING** | Create `apps/api/src/onboarding/onboarding.module.ts`. Imports: PrismaModule, I18nModule. Providers: OnboardingContentService. Exports: OnboardingContentService. Register in `AppModule.imports[]` |

### 12.3 tRPC Endpoints (8 items missing)

All must be added to `apps/api/src/trpc/trpc.router.ts` as `onboardingRouter`.

| # | Endpoint | Type | Auth | Input | Notes |
|---|----------|------|------|-------|-------|
| 5 | `onboarding.intents` | query | public | `{ locale }` | Returns 4 translated intent options |
| 6 | `onboarding.domains` | query | public | `{ locale }` | Returns 9 domains with 68 interests, translated |
| 7 | `onboarding.careerData` | query | public | `{ locale }` | Returns 6 pain points + 7 career targets, translated |
| 8 | `onboarding.goalTemplates` | query | public | `{ locale, domain?, keywords? }` | Returns matching goal templates with milestones. Keyword matching server-side |
| 9 | `onboarding.assessmentQuestions` | query | protected | `{ domain, difficulty? }` | Returns adaptive questions for domain. Locale from user profile |
| 10 | `onboarding.archetypes` | query | public | `{ locale }` | Returns 5 archetypes with translated name/tagline/bestFor |
| 11 | `onboarding.submitAssessment` | mutation | protected | `{ assessments[] }` | Persists assessment results → creates/updates SkillElo records |
| 12 | `onboarding.submitGoal` | mutation | protected | `{ intent, path, dreamGoal, domain, interests, careerTarget, milestones }` | Creates OnboardingSubmission record |

**Also required:** Inject `OnboardingContentService` into `TrpcRouter` constructor. Import `OnboardingModule` in `TrpcModule`.

### 12.4 Frontend i18n (4 items missing)

| # | Item | Status | What's needed |
|---|------|--------|---------------|
| 13 | `useT()` translation hook | **MISSING** | Function that takes i18n key, returns translated string. Fallback to key if missing. Must re-render components on locale change |
| 14 | i18n Zustand store | **MISSING** | Create `packages/store/src/i18n.store.ts`. State: `locale`, `messages: Record<string, string>`, `isLoading`. Actions: `setLocale(locale)` triggers API fetch, `t(key, fallback?)` getter. Export from `packages/store/src/index.ts` |
| 15 | `LocalePicker` → backend sync | **PARTIAL** | Currently only calls `setLocale()` on onboarding store. Must also: (a) update i18n store locale, (b) if authenticated, fire `trpc.user.updatePreferences({ locale })` to persist in DB. File: `apps/web/app/(onboarding)/_components/LocalePicker.tsx` |
| 16 | Dashboard `LocalePicker` | **MISSING** | The dashboard layout (`apps/web/app/(dashboard)/layout.tsx`) has no locale picker. Need one in user menu or settings, calling same `setLocale` + `updatePreferences` |

### 12.5 Frontend Page Migration (5 items missing)

| # | Page | File | Current | Target |
|---|------|------|---------|--------|
| 17 | Intent | `(onboarding)/intent/page.tsx` | Imports `INTENTS` from `_data/intents.ts` | `trpc.onboarding.intents.useQuery({ locale })` with INTENTS fallback |
| 18 | Guided Goal | `(onboarding)/goal/guided/page.tsx` | Imports `DOMAINS` from `_data/domains.ts` | `trpc.onboarding.domains.useQuery({ locale })` with DOMAINS fallback |
| 19 | Career Goal | `(onboarding)/goal/career/page.tsx` | Imports `PAIN_POINTS`, `CAREER_TARGETS` | `trpc.onboarding.careerData.useQuery({ locale })` with fallback |
| 20 | Assessment | `(onboarding)/assessment/page.tsx` | Imports `QUESTIONS` from `_data/assessment-questions.ts` | `trpc.onboarding.assessmentQuestions.useQuery({ domain })` with fallback. Add `submitAssessment` mutation on complete |
| 21 | Character | `(onboarding)/character/page.tsx` | Hardcoded archetypes | `trpc.onboarding.archetypes.useQuery({ locale })` with fallback |

### 12.6 Seed Scripts (1 item missing)

| # | Item | Status | What's needed |
|---|------|--------|---------------|
| 22 | `seed-onboarding-content.ts` | **MISSING** | Script to parse all `_data/*.ts` files and insert into `ref_content` + `ref_translations` (English). ~200 ref_content rows + ~450 ref_translation rows. Must be idempotent (upsert). Run as `npx ts-node apps/api/prisma/seed-onboarding-content.ts` |

### Existing seed-translations.ts gap

Current `seed-translations.ts` seeds 33 UI keys. Missing coverage for onboarding-specific content:
- 0/8 intent translations
- 0/18 domain name+description translations
- 0/68 interest label translations
- 0/13 career pain point translations
- 0/14 career target translations
- 0/135 assessment question+option translations
- 0/15 archetype translations
- 0/60 NPC reaction translations
- **Total gap: ~410 keys × 3 locales = ~1230 missing translation entries**

---

## 13. Full Translation Key Catalog

### 13.1 Onboarding — Intent Page

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.intent.section_label` | Choose your path | heading |
| `onboarding.intent.footer_hint` | You can always change your path later in Hero Settings | hint |
| `onboarding.intent.npc_greeting` | Welcome, hero! Every great quest begins with a single choice. What brings you here today? | NPC |
| `onboarding.intent.know_title` | I know what to learn | card title |
| `onboarding.intent.know_desc` | I have a specific skill or topic in mind | card desc |
| `onboarding.intent.explore_guided_title` | I need direction | card title |
| `onboarding.intent.explore_guided_desc` | I want to grow but not sure where to start | card desc |
| `onboarding.intent.career_title` | Career change | card title |
| `onboarding.intent.career_desc` | I want to switch careers or grow in my role | card desc |
| `onboarding.intent.exploring_title` | Just exploring | card title |
| `onboarding.intent.exploring_desc` | Show me what's possible — no commitment | card desc |

### 13.2 Onboarding — Legend Page

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.legend.skip_button` | Skip Legend → | button |
| `onboarding.legend.screen1_title` | The Realm of Lumen | title |
| `onboarding.legend.screen1_text` | Long ago, in the Realm of Lumen, knowledge was a living force called Lux. It flowed through every corner of the world, illuminating minds and shaping reality. | body |
| `onboarding.legend.screen2_title` | The Dimming | title |
| `onboarding.legend.screen2_text` | Then came the Dimming. The Great Library shattered, its fragments scattered across five lands. Knowledge began to fade, and shadows crept where light once thrived. | body |
| `onboarding.legend.screen3_title` | Your Quest Begins | title |
| `onboarding.legend.screen3_intro` | But heroes always rise. The Sage has been waiting for someone brave enough to restore what was lost. | body |
| `onboarding.legend.sage_dialogue` | Welcome, hero. I knew you'd come. Every journey through knowledge begins with a single step — and yours starts now. | NPC |
| `onboarding.legend.begin_journey_button` | Begin My Journey | button |

### 13.3 Onboarding — Goal Direct Path

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.goal_direct.npc_greeting` | What's your dream skill, hero? Think big — the quest map comes later. | NPC |
| `onboarding.goal_direct.heading` | Describe your dream quest | heading |
| `onboarding.goal_direct.description` | What skill or topic do you want to master? | desc |
| `onboarding.goal_direct.placeholder` | e.g., Become a full-stack developer, Master AI/ML, Learn UI/UX design... | placeholder |
| `onboarding.goal_direct.matched_hint_prefix` | Matched: | label |
| `onboarding.goal_direct.set_dream_button` | Set my dream quest | button |
| `onboarding.goal_direct.milestones_npc` | Here are some milestones to guide your journey. You can customize them. | NPC |
| `onboarding.goal_direct.milestones_heading` | Choose your milestones | heading |
| `onboarding.goal_direct.milestones_desc` | Select milestones for your quest. Tap edit to customize. | desc |
| `onboarding.goal_direct.pyramid_heading` | Your Quest Map | heading |
| `onboarding.goal_direct.continue_button` | Looks good — continue | button |

### 13.4 Onboarding — Goal Guided Path

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.goal_guided.npc_greeting` | Let's explore your interests, hero. Which realm calls to you? | NPC |
| `onboarding.goal_guided.domain_heading` | Pick your realm | heading |
| `onboarding.goal_guided.domain_desc` | Choose the area that interests you most | desc |
| `onboarding.goal_guided.npc_no_interests` | Pick the skills that spark your curiosity, hero! | NPC |
| `onboarding.goal_guided.npc_few_interests` | Great pick! Choosing 3 or more helps me craft a better quest path. | NPC |
| `onboarding.goal_guided.npc_many_interests` | Excellent choices! Your quest path is taking shape. | NPC |
| `onboarding.goal_guided.interests_heading_prefix` | What interests you in | heading |
| `onboarding.goal_guided.interests_desc_prefix` | Pick at least 1 interest | desc |
| `onboarding.goal_guided.selected_suffix` | selected | label |
| `onboarding.goal_guided.custom_interest_placeholder` | Add custom interest... | placeholder |
| `onboarding.goal_guided.trending_badge` | Trending | badge |
| `onboarding.goal_guided.proposal_npc` | Based on your interests, here's a quest path I'd recommend. | NPC |
| `onboarding.goal_guided.proposal_heading` | Your proposed quest path | heading |
| `onboarding.goal_guided.accept_button` | Accept quest path | button |
| `onboarding.goal_guided.change_interests_button` | Change my interests | button |

### 13.5 Onboarding — Goal Career Path

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.goal_career.npc_greeting` | Career change is a bold quest! Tell me about your current situation. | NPC |
| `onboarding.goal_career.current_role_heading` | Your current role | heading |
| `onboarding.goal_career.role_placeholder` | e.g., Marketing Manager, Student, Teacher... | placeholder |
| `onboarding.goal_career.pain_heading` | What's driving the change? | heading |
| `onboarding.goal_career.pain_desc` | Select 1–3 pain points | desc |
| `onboarding.goal_career.pain_salary` | Low salary / compensation | label |
| `onboarding.goal_career.pain_growth` | No growth opportunities | label |
| `onboarding.goal_career.pain_balance` | Poor work-life balance | label |
| `onboarding.goal_career.pain_toxic` | Toxic environment | label |
| `onboarding.goal_career.pain_security` | Job insecurity | label |
| `onboarding.goal_career.pain_boredom` | Boredom / no challenge | label |
| `onboarding.goal_career.target_npc` | Where do you want to be? Let's chart your new path. | NPC |
| `onboarding.goal_career.target_heading` | Choose your target realm | heading |
| `onboarding.goal_career.target_desc` | Where do you see yourself next? | desc |
| `onboarding.goal_career.path_npc` | Here's your career quest map. The journey of a thousand miles begins with one quest. | NPC |
| `onboarding.goal_career.path_heading` | Your career quest path | heading |
| `onboarding.goal_career.accept_button` | Accept career path | button |
| `onboarding.goal_career.change_target_button` | Choose a different target | button |

### 13.6 Onboarding — Assessment Page

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.assessment.intro_npc` | Time to gauge your power level, hero! Don't worry — there are no wrong answers, only XP to gain. | NPC |
| `onboarding.assessment.completion_npc` | Assessment complete! I've measured your abilities. | NPC |
| `onboarding.assessment.level_beginner` | Every hero starts somewhere! Your quests will guide you from the basics. | desc |
| `onboarding.assessment.level_familiar` | You know the terrain! Your quests will build on your existing awareness. | desc |
| `onboarding.assessment.level_intermediate` | Solid foundations! Your quests will build on what you already know. | desc |
| `onboarding.assessment.level_advanced` | Impressive power level! Your quests will challenge you at a high tier. | desc |
| `onboarding.assessment.level_beginner_label` | Beginner | label |
| `onboarding.assessment.level_familiar_label` | Familiar | label |
| `onboarding.assessment.level_intermediate_label` | Intermediate | label |
| `onboarding.assessment.level_advanced_label` | Advanced | label |
| `onboarding.assessment.stat_trials` | Trials | label |
| `onboarding.assessment.stat_correct` | Correct | label |
| `onboarding.assessment.stat_xp` | XP | label |
| `onboarding.assessment.gauge_heading` | Gauge your mastery | heading |
| `onboarding.assessment.self_npc` | How would you describe your experience with this realm? | NPC |
| `onboarding.assessment.self_npc_complete` | Self-assessment noted! Every hero knows their starting point. | NPC |
| `onboarding.assessment.onward_button` | Onward! | button |

### 13.7 Onboarding — Character Page

| i18n Key | EN Value | Type |
|----------|----------|------|
| `onboarding.character.intro_npc` | Choose your hero, brave adventurer! Pick a preset or create your own. | NPC |
| `onboarding.character.heading` | Choose Your Hero | heading |
| `onboarding.character.create_custom_text` | Create custom | button |
| `onboarding.character.cosmetic_note` | Purely cosmetic — you can change anytime in Hero Settings | hint |
| `onboarding.character.create_npc` | A custom hero! Craft your look — hair, skin, outfit. Make it uniquely you. | NPC |
| `onboarding.character.forge_button` | Forge my hero | button |
| `onboarding.character.live_preview_label` | Live preview | label |
| `onboarding.character.hair_style_section` | Hair style | heading |
| `onboarding.character.skin_tone_section` | Skin tone | heading |
| `onboarding.character.hair_color_section` | Hair color | heading |
| `onboarding.character.outfit_color_section` | Outfit color | heading |

### 13.8 Auth — Login Page

| i18n Key | EN Value | Type |
|----------|----------|------|
| `auth.login.heading` | Welcome to Plan2Skill | heading |
| `auth.login.description_mobile` | Sign in to start your personalized learning journey | desc |
| `auth.login.description_desktop` | Sign in to continue your learning journey | desc |
| `auth.login.tagline` | From roadmap to results | tagline |
| `auth.login.google_button` | Continue with Google | button |
| `auth.login.google_loading` | Forging connection... | button |
| `auth.login.apple_button` | Continue with Apple | button |
| `auth.login.terms_prefix` | By continuing, you agree to our | text |
| `auth.login.terms_link` | Terms of Service | link |
| `auth.login.privacy_link` | Privacy Policy | link |
| `auth.login.gis_load_error` | Failed to load Google Sign-In. Check your connection. | error |
| `auth.login.generic_error` | The path is blocked. Try again, hero. | error |

### 13.9 Dashboard — Sidebar & Navigation

| i18n Key | EN Value | Type |
|----------|----------|------|
| `dashboard.nav.command_center` | Command Center | nav |
| `dashboard.nav.quest_map` | Quest Map | nav |
| `dashboard.nav.forge` | The Forge | nav |
| `dashboard.nav.merchant` | Merchant | nav |
| `dashboard.nav.league` | Guild Arena | nav |
| `dashboard.nav.hero_card` | Hero Card | nav |
| `dashboard.sidebar.streak_label` | streak | label |
| `dashboard.sidebar.energy_label` | energy | label |
| `dashboard.sidebar.coins_label` | coins | label |
| `dashboard.usermenu.hero_settings` | Hero Settings | menu |
| `dashboard.usermenu.quiet_mode` | Quiet Mode | menu |
| `dashboard.usermenu.restart_journey` | Restart Journey | menu |
| `dashboard.usermenu.leave_guild` | Leave Guild | menu |
| `dashboard.usermenu.restart_confirm` | Restart your journey? All progress will be reset. | dialog |

### 13.10 Common / Shared

| i18n Key | EN Value | Type |
|----------|----------|------|
| `common.app_name` | Plan2Skill | brand |
| `buttons.continue` | Continue | button |
| `common.xp_earned` | +{n} XP | label |
| `characters.sage` | Sage | name |

### 13.11 Domain Names & Descriptions (9 × 2 = 18 keys)

| i18n Key | EN Value |
|----------|----------|
| `domains.ai.name` | AI & Smart Tools |
| `domains.ai.description` | Build with AI, automate, and prompt like a pro |
| `domains.business.name` | Business & Startups |
| `domains.business.description` | Launch, lead, and grow ventures |
| `domains.tech.name` | Code & Apps |
| `domains.tech.description` | Build software, websites, and apps |
| `domains.creative.name` | Design & Create |
| `domains.creative.description` | Design, illustrate, and tell visual stories |
| `domains.data.name` | Data & Insights |
| `domains.data.description` | Analyze, visualize, and make smart decisions |
| `domains.languages.name` | Languages |
| `domains.languages.description` | Learn new languages and communicate globally |
| `domains.marketing.name` | Marketing & Growth |
| `domains.marketing.description` | Grow audiences, brands, and revenue |
| `domains.leadership.name` | People & Leadership |
| `domains.leadership.description` | Communicate, lead, and level up your career |
| `domains.security.name` | Cyber & Security |
| `domains.security.description` | Protect systems, find vulnerabilities, stay safe |

### 13.12 Career Targets (7 × 2 = 14 keys)

| i18n Key | EN Value |
|----------|----------|
| `career_targets.tech.name` | Tech & Engineering |
| `career_targets.tech.description` | Software development, data, or DevOps |
| `career_targets.product.name` | Product & Strategy |
| `career_targets.product.description` | Product management, UX, or consulting |
| `career_targets.creative.name` | Creative & Design |
| `career_targets.creative.description` | UI/UX, content creation, or brand design |
| `career_targets.data.name` | Data & AI |
| `career_targets.data.description` | Data science, analytics, or AI/ML |
| `career_targets.marketing.name` | Marketing & Growth |
| `career_targets.marketing.description` | Digital marketing, SEO, or brand strategy |
| `career_targets.leadership.name` | Management & Leadership |
| `career_targets.leadership.description` | Team lead, people manager, or executive |
| `career_targets.security.name` | Cybersecurity |
| `career_targets.security.description` | Security analyst, pen tester, or compliance |

### 13.13 Interest Labels (68 keys — sample)

Pattern: `interests.{domain}.{id}`

| i18n Key | EN Value |
|----------|----------|
| `interests.ai.llm` | AI & Large Language Models |
| `interests.ai.prompt_eng` | Prompt Engineering |
| `interests.ai.automation` | AI Automation & Agents |
| `interests.ai.art` | AI Art & Image Generation |
| `interests.ai.coding` | AI-Assisted Coding |
| `interests.tech.web_dev` | Web Development |
| `interests.tech.mobile_dev` | Mobile Development |
| `interests.tech.backend` | Backend Engineering |
| ... | *(68 total across 9 domains)* |

### 13.14 Non-translatable (keep in English)

- Character proper names: Aria, Kofi, Mei, Diego, Zara, Alex, Priya, Liam
- Brand: Plan2Skill
- Technical terms used as IDs
- Archetype IDs in code (strategist, explorer, etc.)

---

## 14. Total Translation Effort

| Category | Keys | × 3 locales | Priority |
|----------|------|-------------|----------|
| Onboarding UI strings | 95 | 285 | P0 |
| Domain names + descriptions | 18 | 54 | P0 |
| Interest labels | 68 | 204 | P0 |
| Career data (pain + targets) | 26 | 78 | P0 |
| Archetype names + descriptions | 15 | 45 | P0 |
| Auth page | 12 | 36 | P0 |
| Dashboard nav + sidebar | 14 | 42 | P0 |
| Common/shared | 4 | 12 | P0 |
| Assessment questions + options | ~135 | ~405 | P1 |
| NPC reactions (assessment) | ~60 | ~180 | P1 |
| **P0 Total** | **~252** | **~756** | |
| **P0+P1 Total** | **~447** | **~1341** | |

Already seeded: 33 keys × 3 = 99 entries. **Remaining: ~1242 entries.**

# Quest Content Pipeline — Requirements Document

> **Status**: Discovery complete, pending approval
> **Date**: 2026-03-06
> **Scope**: Wire AI generators into quest flow with tiered access, domain-aware content routing, and crystal economy

---

## 1. Problem Statement

Plan2Skill has 14 AI generators but only 4 are wired into production. Users open a quest and see **title + description + 1 quiz question** — no learning content, no resources, no tips, no code challenges. Fields `aiTip` and `funFact` in QuestCardModal are empty strings.

The platform needs a content pipeline that:
- Generates rich, diverse learning content per quest
- Gates content by subscription tier (Free / Pro / Champion)
- Uses crystals and coins as engagement + monetization levers
- Routes content format based on learning domain (no code challenges for beekeeping)
- Prevents monotony through anti-fatigue rules

---

## 2. Subscription Tiers

Using existing tier names from `progression.service.ts`:

| | Free | Pro (~$10/mo) | Champion (~$20/mo) |
|---|---|---|---|
| **Quests/day** | 5 (crystal-gated) | 20 | Unlimited |
| **AI hints** | 1/day (1 coin) | 10/day (free) | Unlimited |
| **AI tutor** | Locked | 3 sessions/day | Unlimited |
| **Content depth** | Basic (article + 1 quiz) | Full (+ code challenge, resources) | Full + AI explanations, alternative approaches |
| **Code challenges** | Locked | Available | Available |
| **Resource links** | 1 per quest | Full list (3-7) | Full + AI-curated |
| **Fun facts** | Locked | Available | Available |
| **XP soft cap** | 150/day | 500/day | 1000/day |
| **Ads** | Between sessions | None | None |

### 2.1 Dual Currency System

**Crystals** — session energy (Duolingo Energy model):
- Purpose: limit daily quest volume, drive daily return habit
- 1 crystal = 1 quest attempt (success or fail, no punishment for mistakes)
- Free: 5 crystals/day (auto-refill at midnight, timezone-aware)
- Pro: 20 crystals/day
- Champion: unlimited (no crystal cost)
- Bonus crystals: streak milestones, achievements, weekly challenges
- Crystal regen: 1 crystal per 4 hours (Free only, max 5)

**Coins** — premium content unlock currency:
- Purpose: unlock AI-powered content layers within a quest
- Earned: quest completion (5-15 coins), daily login (3), achievements
- Spent on:
  - AI hint during quest: 2 coins (Free), 0 coins (Pro/Champion)
  - Detailed AI explanation after quiz: 3 coins (Free), 1 coin (Pro), 0 (Champion)
  - Resource recommendations: 2 coins (Free), 0 (Pro/Champion)
  - Fun facts: 1 coin (Free), 0 (Pro/Champion)
  - AI tutor session: 5 coins (Free — locked unless earned enough), 2 coins (Pro), 0 (Champion)
- Pro users get 50 bonus coins/month
- Champion users: all AI features free (coins still earned, spent on cosmetics/shop)

### 2.2 Teaser Strategy (Free Tier)

Free users SEE premium content exists but can't access it without coins:
- Quiz explanation shows first sentence + "🔒 Unlock full explanation (3 coins)"
- Resource section shows 1 free link + "🔒 +4 more resources (2 coins)"
- AI tutor button visible but grayed: "🔒 AI Tutor (Pro feature)"
- Code challenge visible with description but locked: "🔒 Upgrade to Pro"
- After completing 3 milestones, offer 1 free Pro trial quest (taste mechanic)

---

## 3. Domain Classification System

### 3.1 Domain Categories

8 categories that determine which content formats are valid:

```
technical_coding     — Programming, data science, DevOps, web dev
technical_nocoding   — Electronics, networking, CAD, engineering
creative             — Art, music, writing, design, photography
theoretical          — Philosophy, math theory, history, science
physical_practical   — Sports, cooking, beekeeping, woodworking, gardening
business             — Management, marketing, finance, entrepreneurship
language             — Natural languages, linguistics, communication
health_wellness      — Fitness, nutrition, mental health, meditation
```

A domain can belong to multiple categories (e.g., "data visualization" = `technical_coding` + `creative`).

### 3.2 Classification Mechanism

**When**: One-time LLM call (Haiku, BUDGET tier) at roadmap creation, immediately after `RoadmapGenerator.generate()`.

**Output** (cached in DB on Roadmap record):
```typescript
interface DomainClassification {
  categories: DomainCategory[];        // ['physical_practical']
  primaryCategory: DomainCategory;     // 'physical_practical'
  hasCodingComponent: boolean;         // false
  hasPhysicalComponent: boolean;       // true
  hasCreativeComponent: boolean;       // false
  primaryLanguage: string | null;      // null (or "TypeScript" for coding)
  suggestedTooling: string[];          // ["beehive equipment", "protective gear"]
}
```

**Cost**: ~0.1¢ per classification (one-time per roadmap). Cached permanently.

**Prisma schema addition**:
```prisma
model Roadmap {
  // ... existing fields
  domainCategories   String[]   @default([])  // ['physical_practical']
  hasCodingComponent Boolean    @default(false)
  domainMeta         Json?      // full DomainClassification
}
```

### 3.3 Content Format Availability by Domain

| Format | tech_coding | tech_nocoding | creative | theoretical | physical | business | language | health |
|---|---|---|---|---|---|---|---|---|
| article | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| quiz | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| code_challenge | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| video_rec | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| project | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| reflection | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| hands_on | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| boss | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Content Router Architecture

### 4.1 Overview

New service `ContentRouterService` sits between quest selection and content generation. It determines WHICH content format to use for each quest — deterministically, not LLM-decided.

```
Quest opened by user
  → ContentRouterService.route({domain, bloom, proficiency, tier, recentFormats})
  → Returns: selectedFormat + generatorKey
  → Dispatch to appropriate generator(s)
  → Return assembled quest content
```

### 4.2 Routing Logic (Priority Order)

1. **Domain filter**: Remove formats invalid for domain (no code_challenge for beekeeping)
2. **Tier filter**: Remove formats locked for user's tier (code_challenge = Pro+)
3. **Anti-fatigue**: If last 2 quests were same format → remove it from candidates
4. **Anti-quiz-fatigue**: If last 2 quests were quiz/review → force non-assessment format
5. **Ratio balancing**: Adjust weights based on theory:practice:assessment deficit
6. **Milestone diversity**: If <3 unique formats used in current milestone → boost unused
7. **Weighted selection**: Pick format based on adjusted weights

### 4.3 Proficiency-Based Ratios

From education research (expertise reversal effect):

| Proficiency | Theory | Practice | Assessment |
|---|---|---|---|
| beginner | 55% | 30% | 15% |
| intermediate | 30% | 45% | 25% |
| advanced | 15% | 50% | 35% |
| expert | 10% | 50% | 40% |

Format-to-bucket mapping:
- **Theory**: article, video_recommendation, reflection
- **Practice**: code_challenge, project, hands_on_exercise
- **Assessment**: quiz, review, boss

### 4.4 Bloom × Domain Weight Matrix

Each cell in the matrix defines valid formats and their base weights. Example:

**`apply` level + `technical_coding`**:
```
code_challenge: 0.4, project: 0.3, quiz: 0.2, article: 0.1
```

**`apply` level + `physical_practical`**:
```
hands_on_exercise: 0.5, video_recommendation: 0.3, reflection: 0.2
```

**`remember` level + ANY domain**:
```
article: 0.4, video_recommendation: 0.3, quiz: 0.3
```

Full matrix defined in `content-format-matrix.ts` (6 Bloom levels × 8 domain categories = 48 cells).

---

## 5. Content Generation Pipeline

### 5.1 Generation Timing (Hybrid)

| Content Layer | When Generated | Cached |
|---|---|---|
| Quest metadata (title, description, type, XP) | Eager — at roadmap creation | Permanent (in DB) |
| Quiz questions (knowledge check) | Eager — at roadmap creation | Permanent |
| Article/explanation body | Lazy — when user opens quest | 24h cache |
| Code challenge (starter + tests + hints) | Lazy — when user opens quest | 24h cache |
| Resource links | Lazy — when user opens quest | 24h cache |
| Fun facts | Lazy — when user opens quest | 24h cache |
| AI hints/tutor | On-demand — when user requests | No cache (contextual) |
| Motivational message | On-demand — on triggers | 1h cache |

### 5.2 Pre-fetch Strategy

After user completes a quest, pre-fetch content for the next 2 unlocked quests in background:
1. On quest completion → trigger `prefetchNextQuests(userId, milestoneId)`
2. Service identifies next 2 available tasks
3. Runs content generation pipeline for each (article body, quiz, resources)
4. Stores in cache (Redis or DB `QuestContent` table)
5. When user opens next quest → instant content delivery (0ms vs 2-5s)

### 5.3 Quest Content Assembly

When user opens a quest, the `QuestContentService` assembles the full content package:

```typescript
interface QuestContentPackage {
  // Always available (from DB, eager-generated)
  task: Task;                          // title, description, taskType, xpReward, etc.

  // Lazy-generated, tier-gated
  articleBody: string | null;          // Full explanation (Free: summary, Pro+: full)
  quizQuestions: QuizQuestion[];       // 1 question (Free), 3-5 (Pro+)
  codeChallenge: CodeChallenge | null; // Pro+ only, coding domains only
  resources: Resource[];               // 1 (Free), 3-7 (Pro+)
  funFacts: FunFact[];                 // 0 (Free), 1-3 (Pro+)

  // On-demand, coin-gated
  aiHintsRemaining: number;            // Based on tier + daily usage
  aiTutorAvailable: boolean;           // Pro+ or enough coins

  // Locked content teasers (for Free tier)
  lockedFeatures: LockedFeature[];     // What's available if they upgrade/spend coins
}

interface LockedFeature {
  type: 'code_challenge' | 'resources' | 'ai_tutor' | 'explanation' | 'fun_facts';
  teaser: string;                      // Preview text
  unlockMethod: 'coins' | 'upgrade';   // How to unlock
  coinCost: number | null;             // If coin-unlockable
  requiredTier: 'pro' | 'champion';    // If upgrade-only
}
```

### 5.4 Generator Dispatch Map

| Content Format | Generator | Model Tier | Est. Output Tokens |
|---|---|---|---|
| article (body) | QuestGenerator (extended) | BALANCED (Haiku) | 800-1200 |
| quiz (questions) | QuizGenerator | BUDGET (Haiku) | 400-600 |
| code_challenge | CodeChallengeGenerator | BALANCED (Haiku) | 1200-1500 |
| video/resource | ResourceGenerator | BUDGET (Haiku) | 300 |
| fun_facts | FunFactGenerator | BUDGET (Haiku) | 200 |
| AI hint | QuestAssistantGenerator (hint mode) | BALANCED (Haiku) | 200-400 |
| AI tutor | QuestAssistantGenerator (feedback mode) | BALANCED (Haiku) | 200-400 |
| AI explanation | QuestAssistantGenerator (reattempt mode) | BALANCED (Haiku) | 300-500 |
| motivational | MotivationalGenerator | BUDGET (Haiku) | 100-200 |

---

## 6. Quest Assistant (AI Tutor)

### 6.1 Modes

Already implemented in `QuestAssistantGenerator`:
- **hint**: Socratic hint without giving the answer
- **feedback**: Explain why an answer was right/wrong
- **reattempt**: Guide user to correct understanding after failure

### 6.2 Tier Access

| Mode | Free | Pro | Champion |
|---|---|---|---|
| hint | 1/day (2 coins each after) | 10/day (free) | Unlimited |
| feedback | Locked (3 coins) | 5/day (free) | Unlimited |
| reattempt | Locked (5 coins) | 3/day (free) | Unlimited |

### 6.3 Context (L3 Quest Session)

Already implemented in `ContextEnrichmentService`:
- Task title, skill domain, Bloom level, difficulty tier
- Knowledge check question and correct answer
- Previous attempts (from TaskAttempt records)
- Hints already given in this session
- Quality score history

### 6.4 UI Integration

Add to QuestCardModal:
- **"💡 Hint" button**: Visible on all tiers, coin-gated for Free
- **"📖 Explain" button**: After quiz submission, shows AI explanation
- **"🔄 Try Again" button**: After incorrect answer, AI guides to correct understanding
- Each interaction tracked as `TaskAttempt` for L3 context enrichment

---

## 7. Content Validation

### 7.1 Pre-Generation Validation

Before dispatching to any generator:
- Domain has `hasCodingComponent: true` → code_challenge allowed
- Domain categories include `physical_practical` → hands_on_exercise allowed
- Quest Bloom level matches format (no `create`-level for `article` format)
- Subscription tier allows the format

### 7.2 Post-Generation Validation

After LLM returns content:
- Code challenge contains NO code for non-coding domains
- Resource URLs are from known domains (not hallucinated)
- Quiz questions are domain-relevant (keyword overlap check)
- Article length within bounds (200-1500 words)
- Content safety filter (already in BaseGenerator)

### 7.3 Fallback Chain

If primary generation fails:
1. Try template fallback (TemplateService — already implemented)
2. Try simpler format (code_challenge → quiz, project → article)
3. Show quest with metadata only + "Content generating..." placeholder
4. Retry in background, notify when ready

---

## 8. Database Schema Changes

### 8.1 New Table: QuestContent

```prisma
model QuestContent {
  id            String   @id @default(uuid())
  taskId        String   @unique
  task          Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  articleBody   String?  // AI-generated explanation (markdown)
  codeChallenge Json?    // {title, description, starterCode, testCases[], hints[], solutionExplanation}
  resources     Json?    // [{title, url, type, description, difficulty, freeAccess}]
  funFacts      Json?    // [{fact, category, source}]
  quizQuestions Json?    // [{question, options[], correctIndex, explanation, bloomLevel}]

  generatedAt   DateTime @default(now())
  generatorMeta Json?    // {model, tokens, duration, format, cacheKey}
  status        String   @default("pending") // pending | generating | ready | failed

  @@index([taskId])
}
```

### 8.2 Roadmap Extension

```prisma
model Roadmap {
  // ... existing
  domainCategories    String[]  @default([])
  hasCodingComponent  Boolean   @default(false)
  hasPhysicalComponent Boolean  @default(false)
  domainMeta          Json?     // Full DomainClassification
}
```

### 8.3 User Content Budget

```prisma
model UserContentBudget {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  crystals        Int      @default(5)
  crystalMax      Int      @default(5)     // Tier-dependent max
  crystalRegenAt  DateTime?                // Next regen timestamp
  coins           Int      @default(0)

  aiHintsToday    Int      @default(0)
  aiTutorToday    Int      @default(0)
  aiExplainsToday Int      @default(0)

  lastResetDate   String   @default("")   // "YYYY-MM-DD" for daily reset

  @@index([userId])
}
```

---

## 9. New Services

### 9.1 ContentRouterService
- `route(request: ContentRouteRequest): ContentRouteResult`
- Deterministic format selection (no LLM)
- Uses Bloom × Domain matrix + anti-fatigue + ratio balancing

### 9.2 DomainClassifierService
- `classify(domain: string, goal: string): DomainClassification`
- One-time Haiku call per roadmap
- Caches result on Roadmap record

### 9.3 QuestContentService
- `assembleContent(taskId, userId, tier): QuestContentPackage`
- Orchestrates lazy generation + cache lookup + tier gating
- Calls individual generators based on ContentRouter result

### 9.4 ContentBudgetService
- `spendCrystal(userId): boolean` — deduct 1, return false if 0
- `spendCoins(userId, amount): boolean`
- `checkAiQuota(userId, tier, feature): { allowed, remaining }`
- `resetDaily(userId)` — called at midnight
- `grantTierBonus(userId, tier)` — monthly coin grant for Pro

### 9.5 ContentPrefetchService
- `prefetchNextQuests(userId, milestoneId)`
- Background job after quest completion
- Generates content for next 2 unlocked quests

---

## 10. API Endpoints (tRPC)

### New Procedures

```
quest.getContent       — Fetch assembled content for a task (tier-gated)
quest.unlockFeature    — Spend coins to unlock a content feature
quest.requestHint      — AI hint (coin/quota-gated)
quest.requestExplain   — AI explanation (coin/quota-gated)
quest.requestTutor     — AI tutor session (coin/quota-gated)
budget.getBalance      — Current crystals + coins + daily quotas
budget.spendCrystal    — Deduct crystal for quest attempt
domain.classify        — Force re-classify domain (admin)
```

### Modified Procedures

```
roadmap.generate       — Add domain classification step after roadmap generation
progression.completeTask — Add coin reward + prefetch trigger
quest.daily            — Include content status (ready/generating/locked)
```

---

## 11. Frontend Changes

### 11.1 QuestCardModal Enhancement

Current flow: Open quest → See title + quiz → Complete
New flow: Open quest → See full content package → Interact → Complete

**Content sections in modal (top to bottom):**
1. **Header**: Title, type icon, rarity badge, XP reward, estimated time
2. **Article body**: AI-generated explanation (collapsible, auto-expanded)
3. **Knowledge check**: Quiz questions (1 for Free, 3-5 for Pro+)
4. **Code challenge**: Interactive code editor (Pro+ only, coding domains)
5. **Resources**: Curated links (1 Free, 3-7 Pro+)
6. **Fun facts**: Domain trivia (Pro+ only)
7. **AI toolbar**: Hint button, Explain button, Tutor button (coin/tier-gated)
8. **Locked teasers**: Blurred preview + unlock CTA for Free users

### 11.2 Crystal/Coin HUD

- Top bar or sidebar widget showing crystal count + coin balance
- Crystal depletes with satisfying animation on quest start
- Coin +/- animation on earn/spend
- Low crystal warning: "1 crystal left — come back tomorrow or upgrade!"

### 11.3 Upgrade Prompts

Strategic placement (from research: show after value demonstrated, not upfront):
- After completing 3rd milestone: "Unlock AI Tutor for deeper learning"
- When clicking locked feature: Inline upgrade modal with tier comparison
- After streak milestone: "Celebrate with Pro — unlimited crystals!"

---

## 12. Cost Estimates

### Per Quest (all content, Haiku 4.5)

| Component | Cost |
|---|---|
| Article body | 1.0¢ |
| Quiz (3-5 questions) | 0.5¢ |
| Code challenge | 1.0¢ |
| Resources | 0.3¢ |
| Fun facts | 0.2¢ |
| **Total (Pro/Champion quest)** | **~3.0¢** |
| **Total (Free quest — article + 1 quiz)** | **~1.2¢** |

### Monthly Per User (with caching + batch optimization)

| Tier | Quests/day | AI interactions/day | Monthly API cost |
|---|---|---|---|
| Free | 3 | 0.5 | **$0.68** |
| Pro | 8 | 5 | **$2.53** |
| Champion | 15 | 10 | **$5.43** |

### Scale Projections (70% Free / 20% Pro / 10% Champion)

| Users | Monthly | Annual |
|---|---|---|
| 1,000 | $1,522 | $18,264 |
| 10,000 | $15,220 | $182,640 |
| 100,000 | $152,200 | $1,826,400 |

---

## 13. Implementation Phases

### Phase A: Foundation (Domain + Router + Schema)
- [ ] Prisma schema changes (QuestContent, Roadmap extension, UserContentBudget)
- [ ] DomainClassifierService + integration with RoadmapGenerator
- [ ] ContentRouterService (Bloom × Domain matrix + anti-fatigue)
- [ ] ContentBudgetService (crystal/coin management)
- [ ] Content format validation layer

### Phase B: Core Content Pipeline
- [ ] QuestContentService (orchestrator)
- [ ] Wire QuizGenerator into quest content assembly
- [ ] Wire ResourceGenerator into quest content assembly
- [ ] Wire FunFactGenerator into quest content assembly
- [ ] Article body generation (extend QuestGenerator output)
- [ ] tRPC endpoints: quest.getContent, budget.getBalance, budget.spendCrystal

### Phase C: Advanced Content
- [ ] Wire CodeChallengeGenerator (coding domains only)
- [ ] Wire QuestAssistantGenerator (hint/feedback/reattempt)
- [ ] Wire MotivationalGenerator (trigger-based)
- [ ] Content pre-fetch service (background job)
- [ ] tRPC endpoints: quest.requestHint, quest.requestExplain, quest.requestTutor

### Phase D: Frontend Integration
- [ ] QuestCardModal redesign (content sections)
- [ ] Crystal/Coin HUD widget
- [ ] Locked feature teasers (blurred preview + unlock CTA)
- [ ] AI toolbar (Hint, Explain, Tutor buttons)
- [ ] Upgrade prompt placement
- [ ] quest.unlockFeature flow

### Phase E: Optimization
- [ ] Batch API for pre-generated content (50% cost reduction)
- [ ] Prompt caching for system prompts (15% cost reduction)
- [ ] Content quality monitoring dashboard (admin)
- [ ] A/B test: crystal amounts, coin costs, teaser copy
- [ ] Fix cost.ts (Opus 4.6 pricing: $5/$25, not $15/$75)

---

## 14. Open Questions

1. **Code editor**: For code challenges, embed Monaco/CodeMirror in QuestCardModal or link to external sandbox (CodeSandbox, StackBlitz)?
2. **Video content**: ResourceGenerator returns video URLs — embed or open external? YouTube/Vimeo oEmbed?
3. **Article length**: Free tier gets summary (~200 words) vs Pro full (~800-1200 words)? Or same length, different depth?
4. **Spaced repetition integration**: When quest completes, auto-create ReviewItem from quiz questions? Review format different from learning format?
5. **Offline mode (mobile)**: Pre-download quest content for offline completion?

---

## Sources

### EdTech Monetization
- [Duolingo Freemium Model — Motley Fool](https://www.fool.com/investing/2026/03/01/duolingos-freemium-model-faces-its-biggest-test/)
- [Duolingo Energy System](https://blog.duolingo.com/duolingo-energy/)
- [Brilliant Free vs Premium](https://brilliant.org/help/pricing-and-plans/what-s-the-difference-between-free-and-premium/)
- [Mimo Pro vs Max](https://support.mimo.org/hc/en-us/articles/14951451385746)
- [GitHub Copilot Pricing](https://userjot.com/blog/github-copilot-pricing-guide-2025)
- [Khanmigo Pricing](https://www.khanmigo.ai/pricing)
- [Coddy Energy Case Study](https://trophy.so/blog/freemium-energy-system-coddy-case-study)

### Content Format Research
- [Bloom's Taxonomy for Digital Learning — Neovation](https://www.neovation.com/learn/27-what-is-blooms-taxonomy-for-digital-learning)
- [Interleaving vs Blocking — MDPI 2025](https://www.mdpi.com/2076-328X/15/5/662)
- [Example-Problem Ratio by Knowledge Level — Springer 2025](https://link.springer.com/article/10.1007/s40593-025-00511-8)
- [Exam Fatigue — PLOS One](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0070270)
- [LECTOR: LLM-Enhanced Spaced Repetition — arXiv 2025](https://www.arxiv.org/pdf/2508.03275)

### Cost & Pricing
- [Anthropic Official Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Anthropic Prompt Caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [AI Pricing Playbook — Bessemer](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook)
- [RevenueCat State of Subscriptions 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)

### Conversion Optimization
- [Freemium Conversion Rates — Userpilot](https://userpilot.com/blog/freemium-conversion-rate/)
- [EdTech Freemium Conversion — Winsome Marketing](https://winsomemarketing.com/edtech-marketing/freemium-models-in-edtech-when-free-users-actually-convert-to-paid)

# AI Context Flow — Plan2Skill

How context is collected, enriched, filtered, embedded into prompts, and traced.

---

## 1. High-Level Pipeline

```
 tRPC endpoint                Service layer              BaseGenerator (sealed 10-step)
 ─────────────                ─────────────              ──────────────────────────────
 │                            │                          │
 │  input + userId ──────────►│  validate + delegate ───►│  generate(userId, input)
 │                            │                          │
 │                            │                          │  ┌─────────────────────────┐
 │                            │                          │  │ 1. Build context        │
 │                            │                          │  │ 1½ Rate-limit check     │
 │                            │                          │  │ 2. Cache lookup         │
 │                            │                          │  │ 3. Build prompts        │
 │                            │                          │  │ 4. Filter input         │
 │                            │                          │  │ 5. Call LLM             │
 │                            │                          │  │ 6. Parse + Zod validate │
 │                            │                          │  │ 7. Filter output        │
 │                            │                          │  │ 8. Write cache          │
 │                            │                          │  │ 9. Trace (track)        │
 │                            │                          │  │ 10. Return              │
 │                            │                          │  └─────────────────────────┘
 │                            │                          │
 │  ◄────────────── result ◄──│ ◄──── validated TOutput──│
```

---

## 2. Step 1 — Context Assembly (ContextEnrichmentService.build)

Six parallel Prisma queries → five context blocks → budget filter.

```
                    ContextEnrichmentService.build(userId, generatorType)
                    ════════════════════════════════════════════════════
                                         │
              ┌──────────────────────────┼───────────────────────────┐
              │ Promise.all (6 queries)  │                          │
              ▼                          ▼                          ▼
 ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │  Q1: user        │   │  Q2: userProgression │   │  Q3: character       │
 │  ─────────       │   │  ──────────────────  │   │  ───────────         │
 │  id              │   │  level               │   │  characterId         │
 │  locale          │   │  totalXp             │   │  archetypeId         │
 │  role            │   │  subscriptionTier    │   │  evolutionTier       │
 └────────┬─────────┘   └──────────┬───────────┘   │  strength            │
          │                        │                │  intelligence        │
          │                        │                │  charisma            │
          │                        │                │  constitution        │
          │                        │                │  dexterity           │
          │                        │                │  wisdom              │
          │                        │                └──────────┬───────────┘
          │                        │                           │
 ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │  Q4: streak      │   │  Q5: skillElo        │   │  Q6: questCompletion │
 │  ──────          │   │  ──────────          │   │  ────────────────    │
 │  currentStreak   │   │  skillDomain         │   │  questType           │
 │  longestStreak   │   │  elo (top 10 DESC)   │   │  qualityScore        │
 └────────┬─────────┘   └──────────┬───────────┘   │  timeSpentSeconds    │
          │                        │                │  task.estimatedMin   │
          │                        │                │  task.taskType       │
          │                        │                │  task.difficultyTier │
          │                        │                │  (last 30d, max 50)  │
          │                        │                └──────────┬───────────┘
          │                        │                           │
          └────────────────────────┼───────────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   ASSEMBLE BLOCKS   │
                        └────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
  ┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │ UserProfile   │   │ LearningContext  │   │ CharacterContext │
  │ ─────────     │   │ ────────────     │   │ ────────────     │
  │ userId        │   │ currentStreak    │   │ characterId      │
  │ level         │   │ longestStreak    │   │ archetypeId      │
  │ totalXp       │   │ recentCompletions│   │ evolutionTier    │
  │ subscription  │   │ avgQualityScore  │   │ attributes{6}    │
  │ locale        │   │ skillElos[]      │   │                  │
  │ archetypeId?  │   │                  │   │ (only if exists) │
  │ characterId?  │   │                  │   │                  │
  │ evolutionTier?│   │                  │   │                  │
  └───────────────┘   └──────────────────┘   └──────────────────┘
          │                      │                      │
  ┌───────────────────┐   ┌──────────────────┐          │
  │ PerformanceContext│   │ NarrativeContext  │          │
  │ ─────────────     │   │ ────────────     │          │
  │ avgTimeSpentRatio │   │ currentSeason    │          │
  │ completionRate    │   │ lastEpisodeNumber│          │
  │ preferredTypes[3] │   │ narrativeMode    │          │
  │ difficultyDist{}  │   │                  │          │
  │                   │   │ (only if exists) │          │
  └─────────┬─────────┘   └────────┬─────────┘          │
            │                      │                     │
            └──────────────────────┼─────────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   BUDGET FILTER     │
                        │   (per generator)   │
                        └────────┬────────────┘
                                 │
                                 ▼
                          GeneratorContext
                     (only budgeted fields)
```

### Budget Map

```
 Generator               │ userProfile │ learning │ character │ performance │ narrative
 ─────────────────────────┼─────────────┼──────────┼───────────┼─────────────┼──────────
 roadmap                  │     ✓       │    ✓     │     ✓     │             │
 narrative                │     ✓       │          │     ✓     │      ✓      │    ✓
 quest                    │     ✓       │    ✓     │           │      ✓      │
 assessment               │     ✓       │    ✓     │           │             │
 code-challenge           │     ✓       │    ✓     │           │             │
 fun-fact                 │     ✓       │          │           │             │
 milestone-suggestion     │     ✓       │          │           │             │
 motivational             │     ✓       │          │     ✓     │             │
 quiz                     │     ✓       │    ✓     │           │             │
 recommendation           │     ✓       │    ✓     │           │             │
 resource                 │     ✓       │          │           │             │
```

---

## 3. Steps 2–5 — Cache → Prompt Build → Safety → LLM Call

```
 GeneratorContext ─────────────────────────────────────────────────────────►
                  │                                                        │
                  │                                                        │
  Step 2: CACHE   │                                                        │
  ════════        │                                                        │
                  ▼                                                        │
           getCacheKey(input, context)                                     │
           │                                                               │
           ├── null? ─── skip cache ──────────────────────────────────┐    │
           │                                                          │    │
           └── key ──► CacheService.get(key)                          │    │
                       │                                              │    │
                       ├── HIT ──► track(cacheHit=true) ──► return   │    │
                       │                                              │    │
                       └── MISS ──────────────────────────────────────┘    │
                                                                      │    │
                                                                      ▼    │
  Step 3: BUILD PROMPTS                                                    │
  ═════════════════                                                        │
                                                                           │
  ┌─ buildSystemPrompt(context) ◄──────────────────────────────────────────┘
  │  │
  │  │  Each generator picks the context fields it needs:
  │  │
  │  │  roadmap:     level, totalXp, streak, skillElos[5], characterId, attributes
  │  │  narrative:   season, lastEpisode, narrativeMode, archetypeId, attributes
  │  │  quest:       level, streak, qualityScore, skillElos[5], preferredTypes
  │  │  assessment:  level, skillElos[5]
  │  │  motivational: characterId, archetypeId, evolutionTier
  │  │  others:      locale (minimal)
  │  │
  │  └──► systemPrompt: string
  │
  ├─ buildUserPrompt(input, context)
  │  │
  │  │  Some generators adapt by context:
  │  │  - quest:  looks up skillElo for input.domain → sets proficiency tier
  │  │  - roadmap: maps skillElos to Bloom's levels
  │  │  - others: use input only, context via _context
  │  │
  │  └──► rawUserPrompt: string
  │
  │
  Step 4: SAFETY FILTER
  ═════════════════════
  │
  └─ safetyService.filterInput(rawUserPrompt)
     │
     └──► userPrompt: string (sanitized)


  Step 5: LLM CALL
  ═════════════════
  │
  └─ llmClient.call({
         tier:  this.modelTier,    ◄── QUALITY | BALANCED | BUDGET
         systemPrompt,
         userPrompt,
         maxTokens,
         temperature,
         generatorType
     })
     │
     │  Model selection by tier:
     │    QUALITY  → claude-sonnet-4-6  (roadmap, narrative)
     │    BALANCED → claude-haiku       (quest, assessment, code-challenge)
     │    BUDGET   → claude-haiku       (fun-fact, motivational, quiz, etc.)
     │
     └──► LlmResponse { text, model, inputTokens, outputTokens, durationMs, attempt }
```

---

## 4. Steps 6–10 — Validate → Filter → Cache → Trace → Return

```
  LlmResponse.text
  │
  Step 6: PARSE + VALIDATE
  ════════════════════════
  │
  ├── JSON.parse(text) ──── fail? ──► ValidationError + trace failure
  │
  └── outputSchema.safeParse(parsed)
      │
      ├── fail? ──► ValidationError + trace failure (Zod issues logged)
      │
      └── success ──► validated: TOutput


  Step 7: SAFETY FILTER
  ═════════════════════
  │
  └── safetyService.filterOutput(validated)


  Step 8: CACHE WRITE
  ═══════════════════
  │
  └── cacheKey && cacheTtlSeconds > 0 ?
      │
      ├── yes ──► cacheService.set(key, type, validated, ttl)  (fire-and-forget)
      │
      └── no  ──► skip


  Step 9: TRACE
  ═════════════
  │
  └── tracer.trackSuccess({
          userId, generatorType, model,
          inputTokens, outputTokens, durationMs, attempt,
          cacheHit: false,
          systemPrompt?,       ◄── optional (if LLM_TRACE_FULL=true)
          userPrompt?,
          responseText?,
          structuredOutput?
      })
      │
      └──► writes to: llmUsage table  (always)
           writes to: llmTrace table  (if trace mode enabled)


  Step 10: RETURN
  ═══════════════
  │
  └──► validated: TOutput ──► Service Layer ──► tRPC ──► Client
```

---

## 5. Error & Fallback Flow

```
  Step 5: LLM CALL
  │
  └── llmClient.call() ──── THROWS? ───┐
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │  Track failure         │
                            │  (tracer.trackFailure) │
                            └───────────┬───────────┘
                                        │
                                        ▼
                            ┌───────────────────────────────────┐
                            │  templateService.getFallback(     │
                            │    generatorType, input, locale   │
                            │  )                                │
                            └───────────┬───────────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                            ▼                       ▼
                      template found           template null
                            │                       │
                            ▼                       ▼
                   track(model='template')      re-throw error
                   return template result       (propagates to tRPC)
                            │
                            │
  Template resolution:      │
  ─────────────────         │
  TemplateService uses TranslationService for locale-aware fallbacks:
  │
  ├── quest templates  ──► tr('template.quest_review'), tr('template.quest_practice')
  ├── motivational     ──► tr('template.motivational_1..5')
  └── fun facts        ──► tr('template.funfact_1..5')
```

---

## 6. Cache Key Strategies

```
 Generator               │ Cache Key Formula                             │ TTL
 ─────────────────────────┼───────────────────────────────────────────────┼──────
 quest                    │ sha256(userId : skillDomain : YYYY-MM-DD)    │ 1h
 assessment               │ sha256(skillDomain : experienceLevel : count)│ 24h
 code-challenge           │ sha256(lang : domain : bloom : difficulty)   │ 24h
 fun-fact                 │ sha256(skillDomain : topic)                  │ 24h
 milestone-suggestion     │ sha256(dreamGoal : locale)                   │ 10m
 motivational             │ sha256(triggerType : level : streakDays)     │ 1h
 quiz                     │ sha256(skillDomain : count : bloom)          │ 24h
 recommendation           │ sha256(allDomains.join : userLevel)          │ 1h
 resource                 │ sha256(skillDomain : resourceType : count)   │ 24h
 roadmap                  │ null (no caching)                            │ —
 narrative                │ null (no caching)                            │ —
```

---

## 7. Full End-to-End Example: Quest Generation

```
  ┌──────────────┐
  │ tRPC client  │  trpc.quest.generateDaily.useMutation()
  └──────┬───────┘
         │  { skillDomain: 'javascript', bloomLevel: 'apply' }
         ▼
  ┌──────────────┐
  │ tRPC router  │  quest.generateDaily
  └──────┬───────┘
         │  userId from JWT
         ▼
  ┌──────────────────┐
  │ QuestService     │  generateDailyQuests(userId, input)
  └──────┬───────────┘
         ▼
  ┌──────────────────────┐
  │ QuestGenerator       │  .generate(userId, input)
  │ extends BaseGenerator│
  └──────┬───────────────┘
         │
         │  Step 1: ContextEnrichmentService.build(userId, 'quest')
         │          │
         │          ├─ Q1: user         → { locale: 'uk' }
         │          ├─ Q2: progression  → { level: 12, totalXp: 4200, tier: 'free' }
         │          ├─ Q3: character    → { characterId: 'aria', archetypeId: 'strategist', ... }
         │          ├─ Q4: streak       → { currentStreak: 7, longestStreak: 14 }
         │          ├─ Q5: skillElo     → [{ skillDomain: 'javascript', elo: 1340 }, ...]
         │          └─ Q6: completions  → [{ questType: 'review', qualityScore: 0.85, ... }, ...]
         │
         │          Budget for 'quest': [userProfile, learningContext, performanceContext]
         │          → characterContext EXCLUDED (not in budget)
         │          → narrativeContext EXCLUDED
         │
         │          Result: GeneratorContext {
         │            userProfile:       { userId, level: 12, totalXp: 4200, tier: 'free', locale: 'uk' }
         │            learningContext:   { streak: 7, longest: 14, completions: 23, avgQuality: 0.82,
         │                                skillElos: [{javascript: 1340}, {react: 1180}, ...] }
         │            performanceContext:{ avgTimeRatio: 0.9, completionRate: 23, preferred: ['review','quiz','project'],
         │                                difficultyDist: {1:3, 2:8, 3:10, 4:2} }
         │          }
         │
         │  Step 1.5: rateLimitService.check(userId, 'free')  ✓
         │
         │  Step 2: getCacheKey → sha256('userId:javascript:2026-03-05') → 'quest:a1b2c3d4'
         │          cacheService.get('quest:a1b2c3d4') → MISS
         │
         │  Step 3: buildSystemPrompt(context) →
         │    "You are a quest designer for an RPG learning platform.
         │     The hero is level 12 with a 7-day streak.
         │     Average quality score: 82%.
         │     Top skills: javascript (Elo 1340), react (Elo 1180), ...
         │     Preferred task types: review, quiz, project.
         │     Average pacing: 0.9x (slightly ahead of schedule).
         │     Respond in Ukrainian (uk)."
         │
         │          buildUserPrompt(input, context) →
         │    "Generate a quest for skill domain: javascript
         │     Bloom's level: apply
         │     User's javascript Elo: 1340 → intermediate/advanced tier
         │     Adjust difficulty and depth accordingly."
         │
         │  Step 4: safetyService.filterInput(userPrompt) → sanitized
         │
         │  Step 5: llmClient.call({ tier: BALANCED, ... }) → haiku response
         │
         │  Step 6: JSON.parse → Zod validate → QuestOutput
         │
         │  Step 7: safetyService.filterOutput(validated)
         │
         │  Step 8: cacheService.set('quest:a1b2c3d4', 'quest', result, 3600)
         │
         │  Step 9: tracer.trackSuccess({ userId, 'quest', 'haiku', tokens, cost, ... })
         │
         │  Step 10: return validated
         │
         ▼
  ┌──────────────────┐
  │ QuestService     │  store in DB, return to client
  └──────┬───────────┘
         ▼
  ┌──────────────┐
  │ tRPC client  │  onSuccess → update Zustand store → re-render UI
  └──────────────┘
```

---

## 8. Model Tier → Cost Matrix

```
  Tier       │ Model            │ Typical Generators                   │ $/1K input │ $/1K output
  ───────────┼──────────────────┼──────────────────────────────────────┼────────────┼────────────
  QUALITY    │ claude-sonnet-4-6│ roadmap, narrative                   │ $0.003     │ $0.015
  BALANCED   │ claude-haiku     │ quest, assessment, code-challenge    │ $0.00025   │ $0.00125
  BUDGET     │ claude-haiku     │ fun-fact, motivational, quiz, etc.   │ $0.00025   │ $0.00125
```

Cost target: **< $0.25/user/month** via:
- Aggressive caching (24h for reference content, 1h for personalized)
- Budget-tier model for high-frequency calls
- Quality-tier only for high-value outputs (roadmap, narrative)
- Cohort caching for assessment question banks

---

## 9. Data Sources Summary

```
  ┌─────────────────────────────────────────────────────────────┐
  │                     PostgreSQL (Prisma)                      │
  ├─────────────────┬───────────────────────────────────────────┤
  │ user            │ id, locale, role                          │
  │ userProgression │ level, totalXp, subscriptionTier          │
  │ character       │ characterId, archetypeId, evolutionTier,  │
  │                 │ STR, INT, CHA, CON, DEX, WIS              │
  │ streak          │ currentStreak, longestStreak              │
  │ skillElo        │ skillDomain, elo (800–2000)               │
  │ questCompletion │ questType, qualityScore, timeSpent,       │
  │                 │ task → estimatedMin, taskType, difficulty  │
  │ narrativePref   │ narrativeMode, lastReadEpisode            │
  │ season          │ seasonNumber, status                      │
  ├─────────────────┼───────────────────────────────────────────┤
  │ llmUsage        │ userId, generatorType, model, tokens,     │
  │                 │ cost, duration (always written)            │
  │ llmTrace        │ systemPrompt, userPrompt, response        │
  │                 │ (optional, if LLM_TRACE_FULL=true)        │
  └─────────────────┴───────────────────────────────────────────┘
```

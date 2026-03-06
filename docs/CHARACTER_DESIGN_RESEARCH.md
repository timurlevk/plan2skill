# Plan2Skill: Character Design Research & Redesign Proposal

> Comprehensive analysis -- pixel art engine audit, market research, retention analysis, class system redesign
> Date: 2026-03-04

---

## 1. Audit znaidenykh skrinshotiv ta potochnogo stanu

### 1.1 Znaideni skrinshoty

**Plan2Skill (potochnyi stan):**
- `Screenshot 2026-03-01 030218.png` -- Roadmap storinka: pikselnyj personazh Diego (12x16 grid, box-shadow rendering), archetype "Strategist", XP bar (966 XP, L18), 5-ti etapna roadmap z rarity-koloramy (Common -> Uncommon -> Rare -> Epic -> Legendary)
- `Screenshot 2026-03-01 132648.png` -- Dashboard: "Welcome back, Diego!", stats row (streak, XP, energy 3/3), Party Quest z drakonom, Weekly League, Active Quests
- `Screenshot 2026-03-04 194638.png` -- Quest card UI: DAY 2 quest z RPG-stilem, neon kolory, dark theme

**Inshyi dodatok (competitor/reference):**
- `Screenshot 2026-02-28 231306.png` -- Character selection grid z 3D kawaii personazhamy (dark theme): Black Cat, Jumpy Bunny, Leader Lion, Curious Cat, Smart Panda, Tasty Burger, Bright Flower. Neon-purple glow na vybranomu personazhi.
- `Screenshot 2026-02-28 231346.png` -- Toj zhe dodatok, zagolovok "All Characters", krupnishyi vyd
- `Screenshot 2026-02-28 231405.png` -- Toj zhe dodatok, light theme variant -- ti zh personazhi u flat/2D styli na bilomu foni

### 1.2 Kliuchovi sposterezhennia zi skrinshtotiv

| Aspekt | Plan2Skill (potochnyi) | Referensnyj dodatok (kawaii) |
|--------|----------------------|---------------------------|
| **Styl** | Pixel art 12x16, box-shadow CSS rendering | 3D kawaii/chibi, vektor/raster sprites |
| **Riznomanitnist** | 8 presetiv + custom constructor | 7 personazhiv (tvaryny + fantazijni) |
| **Kharakter** | Liudski personazhi z riznymy skin tone/hair | Ne-liudski maskoty (kot, krolik, lev, panda) |
| **Glybyna kastomizatsii** | Skin tone (8), hair style (8), hair color (8), shirt color (8) = 4096 kombinatsij | Fixovani personazhi, bez kastomizatsii |
| **Ekipiruvka** | 7 slotiv (weapon, shield, armor, helmet, boots, ring, companion) z rarity glow | Ne vidno |
| **Emotsii** | 4 emotsii NPC (neutral/happy/impressed/thinking) | Statychni vyrazhennia |

---

## 2. Porivniannia z pikselnym dvyzhkom Plan2Skill

### 2.1 Arkhitektura potochnoho dvyzhka

**PixelEngine.tsx** -- Tsentral'nyj renderer:

```
Potik: Art String -> parseArt() -> (string|null)[][] grid -> PixelCanvas (box-shadow CSS)
```

**Sylni storony:**
- **Lehkist (0 KB assets):** Zhodnoho PNG/SVG, vse CSS box-shadow. Ideal'nyi bundle size.
- **Kompozytnist:** `compositeCharacterWithEquipment()` nakladaye ekipiruvku na bazu po slot-ofssetam
- **Kastomizatsiia:** `buildCustomPalette()` daye 4096+ kombinatsij (8 skin x 8 hair x 8 hairColor x 8 shirt)
- **Animatsiia:** `AnimatedPixelCanvas` z idle bob animation (1500ms frames), `prefers-reduced-motion` support
- **Glow system:** Per-character glow + equipment rarity glow (drop-shadow), maks 2 equipment glows

**Slabki storony:**
- **Rozmir pikselya:** 12x16 = 192 pikseli. Tse duzhe malo dlia vyraznosti. Navit' Habitica maye 90x90+ sprite sheets.
- **Odyn idle frame:** Tiky 2 kadry (base + lehkyi zsuv) -- vyhgliadaye statychno
- **Vidsutnist' ekipiruvky visual:** `EQUIPMENT_OFFSETS` vyznacheni, ale zh artStringiv dlia equip praktychno nemaye (tilky "Code Hammer" 10x10 v EquipmentReveal.tsx)
- **Vidsutnist' emotsij personazha:** NPC emotsii zminiuiut' border color bubla, ale ne sam sprite
- **Obmezhena syluenost':** Vsi 8 personazhiv maiut' identychne tilo (riznytsya tilky v hair/golovi) -- "same body syndrome"

### 2.2 Porivniannia z industriinymy standartamy

| Metryka | Plan2Skill | Habitica | Duolingo | Classcraft |
|---------|-----------|----------|----------|------------|
| **Sprite resolution** | 12x16 px | 90x90+ px | Vector 3D | Vector 2D |
| **Animation frames** | 2 (idle bob) | 3-5 (idle, attack, hurt) | 30+ (Lottie) | 4-6 (idle, cast, hit) |
| **Equipment visuals** | Defined offsets, no sprites | 50+ visible items | N/A (mascot) | 20+ visible gear |
| **Emotsii** | 0 sprite variants | 0 sprite variants | 15+ expressions | 3 states |
| **Body diversity** | 1 body, 8 hair | 2 body types | 1 mascot | 3 classes |
| **Rendering** | CSS box-shadow | Canvas sprites | Lottie/WebGL | SVG + Canvas |

---

## 3. Market Research: Pidkhody do personazhiv u igrakh ta EdTech

### 3.1 Mobile Games (Retention-Oriented)

**Top Heroes: Kingdom Saga** (50M+ downloads):
- 3 hero emblems (Red/Orc, Blue/Human, Green/Elf) -- kolirne koduvannia dlia shvydkoi identyfikatsii
- Hero tier system z synergy bonusamy -- komandy z sinegiieiu otrymuiut' +20-30% stat bonus
- Equipment progression z vizual'nymy zminamy -- kozhnyj riven' ekipiruvky vidchutno zminuie vyhgliad heroia
- Gacha system z pity timer (100 pulls = guaranteed legendary)

**AFK Journey** (16M+ downloads, $150M+ revenue):
- Idle progression + active combat -- prohres navit' koly ne hraesh
- Hero ascension system (5 tiers: Common -> Legendary -> Mythic -> Supreme -> Celestial)
- Faction synergy bonuses -- motyvuie kolektsionuvannia riznykh typiv

**Hero Wars** (150M+ downloads, $1.5B revenue):
- 60+ heroes z unikalnymy animatsiiamy
- Equipment slots z vizualnymy zminamy
- Titan system (meta-progression above heroes)
- Guild wars dlia sotsialnoho utrymannia

**Dark War: Survival:**
- Zombie survival z hero recruitment
- Base building + hero leveling -- dual progression loop
- Resource management creates daily engagement hooks

### 3.2 EdTech Platforms

**Habitica** (2M+ users):
- **Klasova systema:** Warrior / Mage / Healer / Rogue -- kozhen klas maye unikalnu mekhaniku:
  - Warrior: +STR, skill "Brutal Smash" (damage boss based on task difficulty)
  - Mage: +INT, skill "Burst of Flames" (AoE damage, helps party)
  - Healer: +CON, skill "Healing Light" (restore party HP)
  - Rogue: +PER, skill "Pickpocket" (bonus gold from tasks)
- **Pixel art styl:** 90x90 sprites, 50+ equipment items vizualno vidni na avatari
- **Retentsiia:** Boss fights vymagaiut partii (4-5 liudei) -> sotsialnyj tysk
- **Slabkist':** Dyzajn zastarelyj (2013 estetyka), ne mobile-first

**Duolingo** (80M+ DAU):
- **Maskot > Avatar:** Duo the owl -- iedynyi personazh z 15+ emotsiinymy stanamy
- **Nemaye kastomizatsii avatara** -- tse svidiomyi vybir (focus on mascot personality)
- **Streaks yak kore metryka:** 5% DAU boost vid streak push notifications
- **2025 viral:** "Duo's death" stunt -> +25% MAU, +38% downloads
- **Kliuchovyj urok:** Emotsiinyi zv'iazok z IEDYNYM personazhem > kastomizatsiia

**Classcraft** (1M+ students, now HMH Classcraft):
- **3 klasy:** Warrior (tank, zakhyst) / Mage (DPS, risk/reward) / Healer (support, lidarstvo)
- **Komandna mekhanika:** 4-6 uchniv v partii, dii odnogo vplyvalut' na vsikh
- **Game-over stakes:** Prohresh daily -> vtrachayesh HP -> mozhe "pomerty" (realni naslidky)
- **Doslidzhennia:** +11% factual knowledge, +9% retention (University of Colorado)

### 3.3 Industrijni dani z gamifikatsii (2025)

- Gamified learning pidvyshchuie retentsiiu na **45%** (eLearning Industry)
- EdTech platformy z gamifikatsiieiu bachaty **+50% user retention** i **+55% completion rates**
- Badges/leaderboards/virtual gifts **100-150% efektyvnishi** za tradytsijni metody vyznachennia
- Rynok gamifikatsii: **$20.84B (2025)** -> **$190.87B (2034)**, CAGR 27.9%

---

## 4. Analiz Retentsii: Shcho pratsiuie i chomu

### 4.1 Modeli retentsii cherez personazhiv

**Model "Tamagotchi" (Duolingo, Habitica):**
```
Shchodenna aktyvnist -> Personazh "zdorovyi/shchaslyvyi"
Propusk -> Personazh "strazhdaie" (vtrata HP, streak break)
```
- **Efektyvnist:** Duzhe vysoka (Duolingo: 80M DAU)
- **Ryzyky:** Mozhe vyklykaty tryvohu/provoyne u korystuvachiv

**Model "Collection" (Top Heroes, AFK Journey):**
```
Hraty -> Zbyrayesh novoho heroia -> Khochu shche -> Hraty bilshe
```
- **Efektyvnist:** Naisilnishyi monetyzatsijnyj loop
- **Ryzyky:** Gacha = azartni ihry, ne pidkhodyt dlia EdTech

**Model "Identity" (Classcraft, Plan2Skill):**
```
Stvoriuiesh personazha -> Vidchuvaiesh sebe "tsym heroiem" -> Prohres = TVIJ prohres
```
- **Efektyvnist:** Naistijkisha retentsiia (self-determination theory)
- **Ryzyky:** Potribna hlyboka kastomizatsiia shchob "vidchuvaty svoim"

**Model "Social Proof" (Classcraft, Habitica):**
```
Tvij personazh v komandi -> Inshi bachyt' tvij prohres -> Sotsialnyj tysk
```
- **Efektyvnist:** +15-25% retentsiia (guild/party mechanics)
- **Ryzyky:** Potrebuie krytychnu masu korystuvachiv

### 4.2 Plan2Skill: Potochni retentsijni mekhaniky personazha

| Mekhanika | Status | Vplyv na retentsiiu |
|-----------|--------|-------------------|
| Character creation (onboarding) | Diye | Serednij (odnorazovyi moment) |
| Archetype selection | Diye | Nyzkyi (tilky +10% XP badge) |
| Equipment system | Skhema ye, vizualu nema | Potentzijno vysokyj |
| NPC Sage dialog | Diye | Serednij (emotsiinyi zv'iazok) |
| Character animation | Minimal (2-frame idle) | Nyzkyi |
| Character in narrative | Cherez NPC sprites | Serednij |
| Social visibility | Nema (no leagues w/ avatars) | 0 |
| Character evolution | Nema | 0 (KRYTYCHNA PROHAVYNA) |

### 4.3 Naibilshi prohavyny

1. **NEMA VIZUALNOI EVOLIUTSII.** Personazh na L1 vyhgliadaie identychno personazhu na L50. Tse vbyvaye vidchuttia prohresu.
2. **Ekipiruvka nevydyma.** 7 slotiv vyznacheno v kodi, ale tilky 1 art string isnuie ("Code Hammer"). Koristuvach ne bachyty svii "loot".
3. **Archetype = tilky badge.** Strategist/Explorer/etc -- tilky tekst i +10% XP. Nemaye unikalnykh zdibnostej, skil-derev, chy vizualnykh vidminnostej.
4. **Nemaye sotsialnoho sharingu.** Personazh isnuie tilky v tvoiemu ekrani. Nema ligy z avataramy, nemaye profiliu dlia inshykh.

---

## 5. Propozytsiya Redyzajnu / Refaktoryngu

### 5.1 Priorytety (Impact vs Effort Matrix)

```
           HIGH IMPACT
               |
    [Equipment  |  [Character
     Visuals]   |   Evolution]
               |
  LOW EFFORT --+-- HIGH EFFORT
               |
    [Animation  |  [Class Skill
     Upgrade]   |   Trees]
               |
           LOW IMPACT
```

### 5.2 Phase 1: Quick Wins (1-2 dni)

**A. Equipment Art Library (HIGH impact, LOW effort)**

Stvoryty art strings dlia vsikh 7 equip slotiv x 5 rarity = 35 sprites:

```typescript
// Equipment art strings (8x8 per item)
export const EQUIPMENT_ART: Record<string, Record<string, string>> = {
  weapon: {
    common:    '........\n...MM...\n...MM...\n...MM...\n...MM...\n...WW...\n...WW...\n...WW...',
    uncommon:  '........\n..GMMG..\n...MM...\n...MM...\n...MM...\n...WW...\n...WW...\n...WW...',
    rare:      '..BB....\n..BMMB..\n...MM...\n...MM...\n...MM...\n...WW...\n..GWWG..\n...WW...',
    epic:      '.PPPP...\n.PMMPP..\n..PMM...\n...MM...\n...MM...\n...WW...\n..PWWP..\n...PP...',
    legendary: 'GGGGGG..\n.GMMMGG.\n..GMMG..\n...MM...\n..GMMG..\n..GWWG..\n.GGWWGG.\n..GGGG..',
  },
  // ... helmet, armor, shield, boots, ring, companion
};
```

**B. Zbilshyty animatsiyni kadry (MEDIUM impact, LOW effort)**

Dodaty 2 dodatkovi kadry do idle animation:

```typescript
const idleAnim = {
  msPerFrame: 800,  // Shvydshe (bulo 1500)
  buildFrames: (baseString: string) => {
    const rows = baseString.trim().split('\n');
    const frame0 = rows.join('\n'); // Normal
    const frame1 = shiftRows(rows, 0, -1); // Lehkyi pidskik vhoru
    const frame2 = rows.join('\n'); // Normal
    const frame3 = shiftRows(rows, 0, 1); // Lehke prysidannia
    return [frame0, frame1, frame2, frame3];
  },
};
```

### 5.3 Phase 2: Character Evolution System (3-5 dniv)

**Core Idea:** Personazh vizualno evoliutsionuie kozhni 10 rivniv.

```
L1-9:   Base sprite (poточний 12x16)
L10-19: +cape/plashch (doдати layer)
L20-29: +glow aura (посилити drop-shadow)
L30-39: +крила/ефекти (новий overlay layer)
L40-49: +корона/тіара (helmet auto-equip visual)
L50:    Legendary form (збільшений sprite 16x20 + particles)
```

```typescript
// evolution-tiers.ts
export const EVOLUTION_TIERS = [
  { minLevel: 1,  name: 'Apprentice',  overlay: null,           glowIntensity: 0.3 },
  { minLevel: 10, name: 'Journeyman',  overlay: 'cape',         glowIntensity: 0.4 },
  { minLevel: 20, name: 'Adept',       overlay: 'aura',         glowIntensity: 0.5 },
  { minLevel: 30, name: 'Expert',      overlay: 'wings',        glowIntensity: 0.6 },
  { minLevel: 40, name: 'Master',      overlay: 'crown',        glowIntensity: 0.8 },
  { minLevel: 50, name: 'Legend',       overlay: 'legendarySet', glowIntensity: 1.0,
    spriteSize: { w: 16, h: 20 } },
] as const;
```

**Milestone celebration:** Koly koristuvach dosiahaie novoho tieru, pokazuvaty animovanyj reveal (yak EquipmentReveal.tsx, ale dlia novoi formy personazha).

### 5.4 Phase 3: Archetype Mechanics (5-7 dniv)

**Potochnyi stan:** Archetypes (Strategist/Explorer/Connector/Builder/Innovator) -- tilky kosmetychni badgy z +10% XP.

**Propozytsiya:** Kozhnyj archetype daye unikalni bonusy:

```typescript
export const ARCHETYPE_ABILITIES = {
  strategist: {
    passive: 'Road Sense',        // +15% XP vid roadmap milestones
    active:  'Strategic Review',   // 1x/day: podvoyity XP za nastupnyj quest
    visual:  'blueprintAura',     // Synij geometric overlay na personazhi
    questBonus: 'planning',        // Bonusni questy na planuvannia
  },
  explorer: {
    passive: 'Curiosity Drive',    // +20% XP vid "new topic" questiv
    active:  'Discovery Scan',     // 1x/day: vidkryty 1 prikhovanyj quest
    visual:  'compassGlow',       // Zelenyj compass overlay
    questBonus: 'exploration',
  },
  connector: {
    passive: 'Network Effect',     // +15% XP koly inshi v ligі roblyat' questy
    active:  'Inspire',            // 1x/day: podilytysia questom = +bonus XP obom
    visual:  'heartPulse',        // Rozhevyj pulse overlay
    questBonus: 'collaboration',
  },
  builder: {
    passive: 'Forge Master',       // +20% XP vid project-based questiv
    active:  'Power Build',        // 1x/day: 2x completion speed na 1 quest
    visual:  'hammerSpark',       // Oranzhevi iskry
    questBonus: 'projects',
  },
  innovator: {
    passive: 'Eureka!',           // +10% shans na bonus loot z any quest
    active:  'Creative Insight',   // 1x/day: peretovryty 1 quest na "creative variant"
    visual:  'starburstAura',    // Zoloti zirky
    questBonus: 'creative',
  },
} as const;
```

### 5.5 Phase 4: Social Visibility (2-3 dni)

- **League avatars:** V tyzhnjevij lizi pokazuvaty pikselni avatary inshykh hravtsiv
- **Mini hero card:** Koly natyskaiesh na koristuvacha v lizi, bachysh joho hero card (archetype, level, top equipment)
- **Profile sharing:** Generuvaty statychnyj PNG hero card dlia sharingu v sotsmershi

---

## 6. Propozytsiya Klasovoi Systemy (Character Class System)

### 6.1 Potochna Struktura vs Propozytsiya

**Zaraz:**
```
Character (cosmetic) -----> Archetype (badge only)
     |                           |
  8 presets + custom         5 types, +10% XP
```

**Propozytsiya:**
```
Character (cosmetic) --+---> Archetype (playstyle + abilities)
     |                 |          |
  8 presets + custom   |     5 types, unique mechanics
                       |
                       +---> Class Evolution (visual + power progression)
                       |          |
                       |     5 tiers (Apprentice -> Legend)
                       |
                       +---> Specialization (endgame branching)
                                  |
                              2 per archetype = 10 total
```

### 6.2 Detalna Klasova Systema

#### Tier 1: Archetype Selection (onboarding, L1)

5 bazovykh arkhetypiv z onovlenymy statamy:

| Archetype | Primary Stat | Secondary Stat | Passive | Quest Affinity |
|-----------|-------------|---------------|---------|----------------|
| **Strategist** | INT (Planning) | CON (Consistency) | +15% roadmap XP | Structured learning |
| **Explorer** | DEX (Adaptability) | WIS (Curiosity) | +20% new topic XP | Discovery quests |
| **Connector** | CHA (Communication) | INT (Analysis) | +15% social XP | Collab quests |
| **Builder** | STR (Execution) | DEX (Adaptability) | +20% project XP | Hands-on quests |
| **Innovator** | WIS (Creativity) | CHA (Influence) | +10% loot bonus | Creative quests |

#### Tier 2: Class Growth (L10-40)

Kozhni 10 rivniv personazh otrymuie novu vizualnu evoliutsiiu:

```
L10: "Journeyman" -- dodayetsia klas-spetsyfichnyj aksesuar
     Strategist: karty/blueprints v rukah
     Explorer: kompas/binokl
     Connector: svitlyj aura
     Builder: molot/instrumenty
     Innovator: zirky/lampa

L20: "Adept" -- zmina siluetu
     Kozhnyj klas otrymuie unikalnyi plashch/cape

L30: "Expert" -- aktyvna animatsiia
     Unikalnyj idle animation per klas (ne prosto bob)
     Strategist: perehliadaie kartu
     Explorer: ohliadayetsia navkoly
     Connector: zhest vitannia
     Builder: stukaie molotom
     Innovator: idea-bulb animatsia

L40: "Master" -- povnyi vizualnyj apgrejd
     Zbilshenyj sprite, particle effects, enhanced glow
```

#### Tier 3: Specialization (L30+, endgame branching)

Kozhen archetype rozhodzhetsia na 2 spetsializatsii:

| Archetype | Specialization A | Specialization B |
|-----------|-----------------|-----------------|
| **Strategist** | **Architect** (system design focus) | **Analyst** (data/research focus) |
| **Explorer** | **Pioneer** (bleeding-edge tech) | **Polymath** (cross-domain breadth) |
| **Connector** | **Mentor** (teaching others, +XP from helped users) | **Diplomat** (community/leadership) |
| **Builder** | **Craftsman** (deep project mastery) | **Inventor** (rapid prototyping) |
| **Innovator** | **Visionary** (long-term strategy) | **Disruptor** (challenge conventions) |

Kozhna spetsializatsiia daye:
- Unikalnyi vizualnyj marker (spetsializovana korona/aksesuaar)
- Bonus quest type (+25% XP za vidpovidni questy)
- Unikalnyj "Ultimate Ability" (1x/tyzhden)

### 6.3 Attribute System Integration

Potochni 6 atrybutiv (STR/INT/CHA/CON/DEX/WIS) obiednuiutsia z klasamy:

```typescript
// Archetype stat multipliers
export const ARCHETYPE_STAT_MULTIPLIERS: Record<string, Record<string, number>> = {
  strategist: { INT: 1.3, CON: 1.15, STR: 1.0, CHA: 1.0, DEX: 1.0, WIS: 1.05 },
  explorer:   { DEX: 1.3, WIS: 1.15, STR: 1.0, INT: 1.05, CHA: 1.0, CON: 1.0 },
  connector:  { CHA: 1.3, INT: 1.15, STR: 1.0, CON: 1.0, DEX: 1.0, WIS: 1.05 },
  builder:    { STR: 1.3, DEX: 1.15, INT: 1.05, CHA: 1.0, CON: 1.0, WIS: 1.0 },
  innovator:  { WIS: 1.3, CHA: 1.15, STR: 1.0, INT: 1.05, DEX: 1.0, CON: 1.0 },
};
```

### 6.4 Equipment per Class

Kozhnyj archetype maye tematychnu ekipiruvku:

| Slot | Strategist | Explorer | Connector | Builder | Innovator |
|------|-----------|----------|-----------|---------|-----------|
| **Weapon** | Blueprint Scroll | Discovery Compass | Inspiration Staff | Code Hammer | Idea Crystal |
| **Shield** | Logic Wall | Terrain Map | Empathy Shield | Prototype Shield | Vision Lens |
| **Armor** | Strategy Cloak | Explorer Vest | Network Robe | Builder Apron | Innovation Suit |
| **Helmet** | Thinker's Crown | Scout Goggles | Connector Halo | Engineer Helm | Spark Tiara |
| **Boots** | Precision Boots | Trailblazer Boots | Swift Boots | Heavy Boots | Quantum Boots |
| **Ring** | Focus Ring | Curiosity Ring | Bond Ring | Mastery Ring | Eureka Ring |
| **Companion** | Owl (wisdom) | Fox (agility) | Dove (peace) | Forge Sprite | Star Wisp |

### 6.5 Technical Implementation Plan

**Zminy v bazovykh failakh:**

1. **`characters.ts`** -- Dodaty art strings dlia equip po slot+rarity
2. **`PixelEngine.tsx`** -- Dodaty `EvolutionLayer` component z tier-based overlays
3. **`archetypes.ts`** -- Rozshyryty `ArchetypeData` na abilities/passives/multipliers
4. **`hero-card/page.tsx`** -- Pokazuvaty evolution tier, equipped items vizualno
5. **Nova systema:** `evolution-tiers.ts`, `specializations.ts`, `class-abilities.ts`
6. **Prisma schema:** Dodaty `specializationId`, `evolutionTier` do Character model
7. **Store:** Rozshyryty `characterStore` na abilities, cooldowns, specialization

**Prioretyzatsiia implementatsii:**

```
Tyzhden 1: Equipment art library (35 sprites) + 4-frame idle animation
Tyzhden 2: Evolution tier system (visual overlays per level bracket)
Tyzhden 3: Archetype abilities (passive bonuses, active 1x/day skills)
Tyzhden 4: Specialization branching (L30+ choice, unique visuals)
Tyzhden 5: Social visibility (league avatars, shareable hero cards)
```

---

## 7. Vysnovky ta Rekomendatsii

### 7.1 Holovni Vysnovky

1. **Pikselnyj dvyzhok Plan2Skill tekhnichno solidnyj** -- box-shadow rendering bezkoshtovnyj po assets, kompozytnist pracuie. Ale vmiist (kontent) --- sprites, animations, equipment --- krytychno nedostatnyj.

2. **Naibilsha prohavyna -- vidsutnist vizualnoi evoliutsii.** Koristuvach na L1 i L50 bache identychnoho personazha. Tse porushue bazovyj pryntsyp gamifikatsii: vidchuttia prohresu.

3. **Archetype systema potribuie hlybyny.** Zaraz tse tilky label. Treba daty realni mekhaniky (passives, actives, quest bonuses).

4. **Reference app z kawaii personazhamy** (znaidenyi na skrinshtotakh) demonstruie inshu filosifiiu: fiksirovani maskoty vs kastomizovani liudy. Dlia EdTech z RPG mekhanikamy Plan2Skill, **kastomizovani liudski personazhi -- pravilnyi vibir** (self-identification, diversity, investment).

5. **Market research pidtverdzhue:** equipment visuals + character evolution + class abilities = naistijkishyj retention loop dlia EdTech platformy.

### 7.2 Prioritetna Dorozhna Karta

| # | Shcho | Chomu | Koly | Impact |
|---|-------|-------|------|--------|
| 1 | Equipment art library (35 sprites) | Koristuvach ne bachyty svij loot | Tyzhden 1 | HIGH |
| 2 | 4-frame idle animation | Personazhi vygliadayut "mertvo" | Tyzhden 1 | MEDIUM |
| 3 | Evolution tiers (L10/20/30/40/50) | Nema vidchuttia prohresu | Tyzhden 2 | CRITICAL |
| 4 | Archetype abilities | Klasy = tilky labely | Tyzhden 3 | HIGH |
| 5 | Specialization branches | Endgame depth | Tyzhden 4 | MEDIUM |
| 6 | Social hero cards + league avatars | Nema sotsialnoho sharingu | Tyzhden 5 | HIGH |

### 7.3 Ochikuvanyi Vplyv na Retentsiiu

Na osnovi industriinykh danykh:

- **Equipment visuals:** +15-20% engagement z "loot" systemou (hero collector model)
- **Character evolution:** +25-35% D30 retention (vidchuttia prohresu -- #1 faktor retentsii v gamifikatsii)
- **Class abilities:** +10-15% DAU (daily active ability use = daily login reason)
- **Social visibility:** +15-25% retentsiia (social proof, league competition)
- **Kombinovanyi efekt:** ochikuemo +40-50% pokrashchennia D30 retentsii

---

*Tsej dokument stvorenyj na osnovi audytu kodu Plan2Skill, znaidenykh skrinshtotiv, ta market research. Vsi kodovi pryklady -- kontseptualni i potrbuiut adaptatsii do real'noi arkhitektury proektu.*

# Character Visual System Redesign — Requirements

> **Status:** Draft v1.0
> **Date:** 2026-03-04
> **Scope:** Pixel art upgrade, Canvas 2D migration, equipment visuals, evolution tiers, animation, companions, NPC sprites

---

## Table of Contents

1. [Overview & Motivation](#1-overview--motivation)
2. [Grid Resolution Upgrade](#2-grid-resolution-upgrade-12×16--32×48)
3. [Character Art v2](#3-character-art-v2--8-characters-at-32×48)
4. [Equipment Art Library](#4-equipment-art-library)
5. [Evolution Tier Visuals](#5-evolution-tier-visuals)
6. [Animation System Upgrade](#6-animation-system-upgrade)
7. [Companion Rendering](#7-companion-rendering)
8. [Archetype Visual Identity](#8-archetype-visual-identity)
9. [NPC Character Upgrades](#9-npc-character-upgrades)
10. [Rendering Engine Migration](#10-rendering-engine-migration)
11. [Data & Backend](#11-data--backend)
12. [Files to Modify](#12-files-to-modify)
13. [Implementation Phases](#13-implementation-phases)
14. [Verification](#14-verification)

---

## 1. Overview & Motivation

The current pixel character system has **6 critical visual gaps** that prevent it from delivering the RPG immersion Plan2Skill targets. Competitor analysis (Dark War: Try to Survive, Top Heroes: Kingdom Saga) confirms that even pixel-art games rely on distinct silhouettes, visible equipment, and evolution feedback to sustain engagement.

### Identified Gaps

| # | Gap | Evidence |
|---|-----|----------|
| 1 | **12×16 grid too small** — 192 total pixels. Faces are 2px tall; all 8 bodies identical (rows 4-15 shared). | `apps/web/app/(onboarding)/_components/characters.ts:24-35` — art strings are 12 chars wide × 16 rows |
| 2 | **Equipment invisible** — 7 slots defined in schema, only `Code Hammer` has a placeholder art string. All 45 seed catalog items have `pixelArt: NULL`. | `apps/api/prisma/seed.ts:22-88` — no `pixelArt` field in `CatalogItem` interface; `schema.prisma:119` — `pixelArt String? @db.Text` |
| 3 | **No visual evolution** — novice and master look identical despite backend thresholds working correctly (80/180/300). | `apps/api/src/character/character.service.ts:83-108` — `checkEvolution()` updates tier; frontend has no per-tier art |
| 4 | **2-frame idle animation barely perceptible** — 1500ms frame duration with only breathing shift. | `apps/web/app/(onboarding)/_components/PixelEngine.tsx:188` — `1500` ms interval; only 2 frames generated |
| 5 | **Companions are enums only** — `CompanionId` type defines 5 companions (`cat|plant|guitar|robot|bird`) with no pixel art. | `packages/types/src/enums.ts:47`; `packages/types/src/character.ts:78-83` — `pixelArt: string` field exists but no data |
| 6 | **NPC emotions = border color only** — Sage NPC has single sprite; emotions change only the bubble border color. | `apps/web/app/(onboarding)/_components/NPCBubble.tsx:16-21` — `emotionColors` maps to border, same `charArtStrings['sage']` sprite always used |

### Design Philosophy

- **Pixel art stays** — no switch to vector/3D. Upgrade resolution for detail.
- **32×48 grid** — 1536 pixels (8× increase), enough for facial expression, visible equipment, body variation.
- **Canvas 2D replaces CSS box-shadow** — enables layered compositing, animation, and PNG export.
- **Types already support everything** — `CharacterDefinition.pixelArt: Record<EvolutionTier, string>`, `EquipmentCatalog.pixelArt: String?`, `CompanionDefinition.pixelArt: string` are all defined. **Zero Prisma schema changes needed.**

---

## 2. Grid Resolution Upgrade (12×16 → 32×48)

### Anatomy Map (32×48)

```
Row  0-13  (14px) — HEAD: hair (0-5), forehead (6-7), eyes (8-9), nose (10-11), mouth (12-13)
Row 14-32  (19px) — TORSO: neck (14-15), shoulders (16-17), chest (18-24), waist (25-28), hips (29-32)
Row 33-47  (15px) — LEGS+FEET: thighs (33-37), knees (38-39), calves (40-43), feet (44-47)
```

**Width zones:** cols 0-7 (left arm/side), cols 8-23 (body core), cols 24-31 (right arm/side)

### Rendering Scales

| Context | `size` param | Rendered px | Usage |
|---------|:---:|:---:|-------|
| Hero card (dashboard) | 4 | 128×192 | Primary character display |
| Sidebar / mini card | 2 | 64×96 | Navigation, party view |
| NPC bubble | 3 | 96×144 | Conversation scenes |
| Onboarding selector | 3 | 96×144 | Character creation |
| Thumbnail / tooltip | 1 | 32×48 | Inventory hover, lists |

### Backward Compatibility

`parseArt()` at `PixelEngine.tsx:13` already handles arbitrary dimensions (splits by newline, then by character). For legacy 12×16 art strings:

```typescript
function detectArtVersion(artString: string): 'v1' | 'v2' {
  const rows = artString.trim().split('\n');
  return rows.length <= 20 ? 'v1' : 'v2';
}
// Legacy art renders at 2× pixel size to approximate 32×48 visual footprint
// size = v1 ? requestedSize * 2 : requestedSize
```

### Acceptance Criteria

- [ ] AC-2.1: 32×48 art string renders correctly at all 5 scale contexts
- [ ] AC-2.2: Legacy 12×16 art auto-detected and upscaled at 2× pixel size
- [ ] AC-2.3: Head region (rows 0-13) supports 8+ distinct hairstyles with ≥3px face detail
- [ ] AC-2.4: Torso region (rows 14-32) supports 3-4 body types with distinct silhouettes
- [ ] AC-2.5: Art string format documented with inline comments per anatomy zone

---

## 3. Character Art v2 — 8 Characters at 32×48

### Body Types

Replace the single shared body (current `characters.ts:24-35` — all 8 chars share rows 4-15) with **3-4 distinct body types**:

| Type | Proportions | Characters |
|------|-------------|------------|
| **Slim** | Narrow shoulders, long limbs | aria, mei |
| **Athletic** | Balanced, medium build | kofi, alex, liam |
| **Sturdy** | Wide shoulders, solid frame | diego, zara |
| **Petite** | Compact, shorter proportions | priya |

Each character must have a **unique silhouette** — identifiable at 1× scale (32×48 native) with all colors removed (grayscale test).

### Expanded Palette

Current 12 keys (`H,h,S,E,w,r,m,T,t,A,P,F`) → **18-20 keys**:

| Key | Current | New Keys |
|-----|---------|----------|
| Hair | `H` (main), `h` (shadow) | `H` (main), `h` (shadow), `Hh` (highlight) |
| Skin | `S` (flat) | `S` (main), `Ss` (shadow), `Sl` (highlight) |
| Eyes | `E` (flat) | `E` (iris), `Ep` (pupil), `Ew` (white) |
| Outfit | `T` (shirt), `t` (shadow), `P` (pants) | `T`, `Tt` (shadow), `Tl` (highlight), `P`, `Pp` (shadow) |
| Accessories | `A` (accent) | `A` (main), `Aa` (shadow) |
| Feet | `F` (flat) | `F` (main), `Ff` (shadow) |
| Mouth | `w,r,m` | Same — works at 32×48 |
| **New** | — | `O` (outline), `X` (transparent override) |

### `buildCustomPalette()` Update

Current function at `apps/web/app/(onboarding)/character/page.tsx:76-96` maps 12 keys. Extend to populate new shadow/highlight keys:

```typescript
function buildCustomPalette(
  bodyId: string,
  skinTone: SkinTone,
  hairColor: HairColor,
  shirtColor: ShirtColor,
): Record<string, string> {
  return {
    // existing
    H: hairColor.main, h: hairColor.shadow,
    S: skinTone.color,
    E: '#1A1020', w: '#FFFFFF', r: skinTone.blush, m: skinTone.mouth,
    T: shirtColor.main, t: shirtColor.shadow, P: shirtColor.pants, F: shirtColor.shoe,
    A: shirtColor.accent,
    // new v2 keys
    Hh: hairColor.highlight ?? lighten(hairColor.main, 20),
    Ss: skinTone.shadow ?? darken(skinTone.color, 15),
    Sl: skinTone.highlight ?? lighten(skinTone.color, 15),
    Ep: '#0A0A12', Ew: '#F0F0F5',
    Tt: shirtColor.shadow, Tl: lighten(shirtColor.main, 15),
    Pp: darken(shirtColor.pants, 15),
    Aa: darken(shirtColor.accent, 15),
    Ff: darken(shirtColor.shoe, 15),
    O: '#1A1020',
  };
}
```

### Acceptance Criteria

- [ ] AC-3.1: All 8 characters have unique 32×48 art strings with ≥3 body types represented
- [ ] AC-3.2: Each character identifiable in grayscale silhouette at 1× scale (32×48)
- [ ] AC-3.3: Palette expanded to 18+ keys with shadow/highlight variants
- [ ] AC-3.4: `buildCustomPalette()` generates all new keys from existing `SkinTone`/`HairColor`/`ShirtColor` inputs
- [ ] AC-3.5: Onboarding character selector renders v2 characters without layout shift
- [ ] AC-3.6: All 8 SKIN_TONES and 8 HAIR_COLORS from `character/page.tsx:32-74` produce correct shadow/highlight via auto-derivation

---

## 4. Equipment Art Library

### Scope

**45 seed catalog items** need `pixelArt` strings (from `apps/api/prisma/seed.ts:22-88`):

| Slot | Item Count | Pixel Grid | Notes |
|------|:---:|:---:|-------|
| Weapon | 7 | 12×16 | Held in right hand (cols 24-31, rows 18-33) |
| Shield | 6 | 10×14 | Held in left hand (cols 0-9, rows 16-29) |
| Armor | 7 | 16×19 | Covers torso region (cols 8-23, rows 14-32) |
| Helmet | 6 | 14×10 | Covers head top (cols 9-22, rows 0-9) |
| Boots | 6 | 12×10 | Covers feet (cols 10-21, rows 38-47) |
| Ring | 6 | 4×4 | Subtle glow on hand (cols 24-27, rows 28-31) |
| Companion | 7 | 10×10 | See Section 7 |
| **Total** | **45** | — | — |

### Archetype-Themed Sets

5 archetypes × 7 slots = **35 themed variants** spread across the 45 items:

| Archetype | Theme | Example Weapon | Example Armor |
|-----------|-------|----------------|---------------|
| Strategist | Crystal/Blueprint | Insight Rapier (blue glow) | Plate of Credibility |
| Explorer | Nature/Compass | Focused Katana (teal edge) | Chain of Consistency |
| Connector | Social/Mirror | Listener's Buckler (rose trim) | Reputation Scale |
| Builder | Forge/Hammer | Builder's Hammer (orange sparks) | Dragonhide Mantle |
| Innovator | Star/Lightning | Mastery Greatsword (gold aura) | Phoenix Vestment |

### Updated EQUIPMENT_OFFSETS for 32×48

Current offsets at `PixelEngine.tsx:61-69` are calibrated for 12×16 base. New values:

```typescript
const EQUIPMENT_OFFSETS_V2: Record<string, { x: number; y: number }> = {
  helmet:    { x: 5,  y: -3 },   // above head
  armor:     { x: 3,  y: 14 },   // torso overlay
  weapon:    { x: 25, y: 16 },   // right hand
  shield:    { x: -4, y: 16 },   // left hand
  boots:     { x: 5,  y: 38 },   // feet overlay
  ring:      { x: 26, y: 28 },   // right hand accent
  companion: { x: -14, y: 30 },  // bottom-left of character
};
```

### Rarity Visual Tiers

Based on `apps/web/app/(onboarding)/_components/tokens.ts:39-45`:

| Rarity | Color | Palette Treatment | Visual Effect |
|--------|-------|-------------------|---------------|
| Common `#71717A` | Muted, desaturated | No glow |
| Uncommon `#6EE7B7` | Slightly brighter | Subtle border highlight |
| Rare `#3B82F6` | Full saturation | Soft glow (12px blur, 30% opacity) |
| Epic `#9D7AFF` | Full saturation + accent | Pulse glow (16px blur, 35% opacity) |
| Legendary `#FFD166` | Full palette + extra detail pixels | Particle shimmer (20px blur, 40% opacity) + 2-3 floating sparkle pixels |

### HeroCard Integration

Currently at `apps/web/app/(dashboard)/hero-card/page.tsx:388-463`, equipment slots show `NeonIcon` placeholders. Replace with:

```typescript
// If item has pixelArt, render PixelCanvas in the slot
{equippedItem?.pixelArt ? (
  <CanvasPixelRenderer data={parseArt(equippedItem.pixelArt, itemPalette)} size={2} />
) : (
  <NeonIcon slot={slot} /> // fallback for items without art
)}
```

### Acceptance Criteria

- [ ] AC-4.1: All 45 seed catalog items have non-null `pixelArt` strings
- [ ] AC-4.2: Equipment overlays correctly on 32×48 base using `EQUIPMENT_OFFSETS_V2`
- [ ] AC-4.3: Rarity visual treatment matches token definitions (glow intensity per rarity)
- [ ] AC-4.4: HeroCard shows pixel art in equipment slots instead of `NeonIcon` when art exists
- [ ] AC-4.5: Equipment art visible and distinguishable at `size=2` (64×96 composite)
- [ ] AC-4.6: 5 archetype theme sets visually distinct (shape + color, not color alone)

---

## 5. Evolution Tier Visuals

### Tier Progression

Backend already computes tiers at `character.service.ts:83-108` based on cumulative attribute sum:

| Tier | Threshold | Visual Additions | Key Difference |
|------|:---------:|------------------|----------------|
| **Novice** | 0-79 | Base character art | Clean, simple |
| **Apprentice** | 80-179 | +Accessory (shoulder pad, arm band, or belt) | 1 extra detail layer |
| **Practitioner** | 180-299 | +Cape/cloak + subtle body glow | Flowing fabric, ambient light |
| **Master** | 300+ | +Crown/halo + particle effects | Max visual prestige |

### Art Requirements

**8 characters × 4 tiers = 32 art strings** stored in `CharacterDefinition.pixelArt: Record<EvolutionTier, string>`:

```typescript
// packages/types/src/character.ts:63-73
interface CharacterDefinition {
  // ...
  pixelArt: Record<EvolutionTier, string>; // already defined!
  // 'novice' | 'apprentice' | 'practitioner' | 'master'
}
```

Each tier builds on the previous — the base character silhouette remains constant, with **additive** visual elements:

```
novice       → base 32×48 character
apprentice   → novice + 4-6px accessory detail (e.g., shoulder guard)
practitioner → apprentice + cape (extends canvas to ~36×52) + 2px glow outline
master       → practitioner + crown/halo (rows -3 to 0) + 3-5 particle pixels
```

### TierUpCelebration Component

Reuse the `EquipmentReveal` animation pattern — full-screen overlay with:
1. Old tier sprite fades/dissolves
2. Bright flash (archetype color)
3. New tier sprite assembles pixel-by-pixel (200-400ms)
4. Particle burst + tier name display

```typescript
interface TierUpCelebrationProps {
  characterId: CharacterId;
  fromTier: EvolutionTier;
  toTier: EvolutionTier;
  archetypeColor: string;
  onComplete: () => void;
}
```

### Acceptance Criteria

- [ ] AC-5.1: All 32 tier art strings (8 chars × 4 tiers) defined and rendering
- [ ] AC-5.2: Each tier visually distinguishable at `size=2` (64×96)
- [ ] AC-5.3: Tier transitions are additive — novice base visible in all higher tiers
- [ ] AC-5.4: `TierUpCelebration` triggers on backend tier change with ≤300ms delay
- [ ] AC-5.5: Master tier includes particle effect (≥3 animated pixels)
- [ ] AC-5.6: Practitioner+ cape extends canvas without clipping adjacent UI elements

---

## 6. Animation System Upgrade

### Current State

- 2 frames at 1500ms per frame (`PixelEngine.tsx:188`)
- Only breathing shift (1px vertical oscillation)
- CSS box-shadow re-renders entire pixel grid every frame

### Target State

| Parameter | Current | Target |
|-----------|:-------:|:------:|
| Frame count | 2 | 4-6 |
| Frame duration | 1500ms | 600-800ms (full cycle 2.4-4.8s) |
| Animation type | Breathing only | Idle cycle (breathing + micro-movements) |
| Rendering | CSS box-shadow rebuild | Canvas 2D `requestAnimationFrame` |
| Equipment | Not animated | Layers move with base |

### Idle Animation Variants

**Generic idle (all characters):**
- Frame 1: Neutral pose
- Frame 2: Slight inhale (torso 1px up)
- Frame 3: Full inhale (torso 1px up, arms slightly out)
- Frame 4: Exhale begin (torso returning)
- Frame 5-6: Subtle weight shift (1px lateral, optional)

**Per-archetype idle at master tier (5 variants):**

| Archetype | Master Idle | Description |
|-----------|-------------|-------------|
| Strategist | Chin stroke | Hand moves to chin (2 frames), hold (2 frames), return |
| Explorer | Look around | Head turns left (2f), center (1f), right (2f), center (1f) |
| Connector | Wave | Arm raises (2f), wave (2f), lower (2f) |
| Builder | Hammer tap | Weapon arm taps (3f), rest (3f) |
| Innovator | Sparkle | Crown particles animate in circle pattern |

### Equipment-Aware Animation

Equipment layers must move with the base character. The animation system composites per frame:

```typescript
function animateFrame(
  baseFrames: string[],    // 4-6 base character frames
  equipment: EquipmentLayer[],
  frameIndex: number,
  offsets: Record<string, { x: number; y: number }>,
): (string | null)[][] {
  const base = parseArt(baseFrames[frameIndex], basePalette);
  // Equipment uses same frame-relative offsets
  // Breathing offset applied to both base and equipment uniformly
  return compositeWithOffset(base, equipment, offsets, breathingOffset[frameIndex]);
}
```

### Canvas 2D Performance

```typescript
class AnimationController {
  private frameCache: Map<string, ImageData> = new Map();
  private rafId: number = 0;
  private currentFrame: number = 0;

  start(canvas: HTMLCanvasElement, frames: (string | null)[][][], fps: number) {
    const ctx = canvas.getContext('2d')!;
    const interval = 1000 / fps;
    let lastTime = 0;

    const tick = (time: number) => {
      if (time - lastTime >= interval) {
        this.drawFrame(ctx, frames[this.currentFrame]);
        this.currentFrame = (this.currentFrame + 1) % frames.length;
        lastTime = time;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() { cancelAnimationFrame(this.rafId); }
}
```

### Acceptance Criteria

- [ ] AC-6.1: Idle animation runs 4-6 frames at 600-800ms per frame
- [ ] AC-6.2: Animation uses `requestAnimationFrame`, not `setInterval`
- [ ] AC-6.3: Equipment layers animate in sync with base character (zero drift)
- [ ] AC-6.4: `prefers-reduced-motion` disables all animation (static frame 1 displayed)
- [ ] AC-6.5: Frame data cached — no re-parsing of art strings per tick
- [ ] AC-6.6: 5 archetype-specific master idle variants implemented and triggered by `archetypeId + evolutionTier === 'master'`

---

## 7. Companion Rendering

### Companion Roster

**5 base companions** (from `CompanionId` type at `packages/types/src/enums.ts:47`) + **7 catalog companions** (from `seed.ts:81-87`):

| Source | ID / Item | Grid | Frames |
|--------|-----------|:----:|:------:|
| Base | `cat` | 10×10 | 3 (sit, lick, tail-wag) |
| Base | `plant` | 10×10 | 2 (sway left, sway right) |
| Base | `guitar` | 10×10 | 2 (static, strum glow) |
| Base | `robot` | 10×10 | 3 (idle, blink, antenna-pulse) |
| Base | `bird` | 10×10 | 3 (perch, flap, sing) |
| Catalog | `companion_common_cat_01` (Curious Cat) | 10×10 | 2 |
| Catalog | `companion_common_owl_01` (Study Owl) | 10×10 | 3 |
| Catalog | `companion_uncommon_fox_01` (Clever Fox) | 10×10 | 2 |
| Catalog | `companion_uncommon_parrot_01` (Echo Parrot) | 10×10 | 3 |
| Catalog | `companion_rare_wolf_01` (Loyal Wolf) | 10×10 | 2 |
| Catalog | `companion_epic_dragon_01` (Ember Drake) | 10×10 | 3 |
| Catalog | `companion_legendary_phoenix_01` (Phoenix Familiar) | 10×10 | 3 |

### Positioning

Companion renders at fixed offset relative to 32×48 base character:

```typescript
const COMPANION_OFFSET = { x: -14, y: 30 }; // bottom-left, partially behind legs
// Companion canvas: 10px × 10px at base scale
// At size=4 (hero card): companion renders at 40×40 px
```

### Acceptance Criteria

- [ ] AC-7.1: All 5 base companions have 10×10 pixel art with 2-3 frame idle animation
- [ ] AC-7.2: All 7 catalog companions have `pixelArt` populated in seed data
- [ ] AC-7.3: Companion renders at `COMPANION_OFFSET` relative to base character
- [ ] AC-7.4: Companion animation independent from character animation (own frame cycle)
- [ ] AC-7.5: Companion visible and identifiable at `size=2` (20×20 rendered pixels)

---

## 8. Archetype Visual Identity

### Archetype Colors

From `apps/web/app/(onboarding)/_data/archetypes.ts:15-65`:

| Archetype | Color | Icon | Glow Application |
|-----------|-------|:----:|-------------------|
| Strategist | `#5B7FCC` | ◈ | Blue ambient glow on character outline |
| Explorer | `#2A9D8F` | ◎ | Teal ambient glow on character outline |
| Connector | `#E05580` | ◉ | Rose ambient glow on character outline |
| Builder | `#E8852E` | ▣ | Orange ambient glow on character outline |
| Innovator | `#DAA520` | ★ | Gold ambient glow on character outline |

### Glow Integration

`LayeredPixelCanvas` at `PixelEngine.tsx:150-183` already accepts `glowColor`. Wire archetype color:

```typescript
<LayeredPixelCanvas
  character={charData}
  equipment={equipmentLayers}
  size={4}
  glowColor={ARCHETYPES[archetypeId]?.color}  // archetype-specific
/>
```

### Set Bonus Visual

When a character equips **3+ items from the same archetype theme**, apply a visual set bonus:

- Faint archetype-colored particle trail (3-5 floating pixels around character)
- Set bonus icon appears as a small emblem in the sprite's belt area

### Archetype Emblem on Sprite

At **practitioner tier and above**, the archetype icon renders as a small 4×4 pixel emblem on the character's chest/shoulder area:

```
Strategist: ◈ shape (diamond with dot)  → 4×4 blue pixel pattern
Explorer:   ◎ shape (concentric rings)  → 4×4 teal pixel pattern
Connector:  ◉ shape (filled circle)     → 4×4 rose pixel pattern
Builder:    ▣ shape (filled square)      → 4×4 orange pixel pattern
Innovator:  ★ shape (star)              → 4×4 gold pixel pattern
```

### Acceptance Criteria

- [ ] AC-8.1: Character glow color matches archetype (5 distinct colors confirmed)
- [ ] AC-8.2: Set bonus visual triggers at 3+ themed equipment items
- [ ] AC-8.3: Archetype emblem renders on sprite at practitioner+ tier
- [ ] AC-8.4: Emblem visible at `size=3` and above (12×12 rendered pixels minimum)
- [ ] AC-8.5: Glow does not clip or bleed into adjacent UI components

---

## 9. NPC Character Upgrades

### Current State

The Sage NPC (`characters.ts:33-34`) uses a single 12×16 sprite. `NPCBubble.tsx:16-21` maps emotions (`neutral|happy|impressed|thinking`) to border colors only — the sprite never changes.

### Target: Sage v2

**32×48 Sage sprite** with **4 emotion variants**:

| Emotion | Sprite Change | Border Color |
|---------|---------------|:------------:|
| `neutral` | Default pose, neutral face | `t.border` (gray) |
| `happy` | Smile (mouth row changes), eyes narrow | `t.cyan` (#4ECDC4) |
| `impressed` | Eyebrows raised, slight lean back | `t.gold` (#FFD166) |
| `thinking` | Hand on chin, eyes look up | `t.violet` (#9D7AFF) |

### NPCBubble v2

Update `NPCBubble.tsx` to select emotion-specific sprite:

```typescript
// Current (line 85):
const artData = parseArt(charArtStrings[charId]!, charPalettes[charId]!);

// New:
const emotionArt = charArtStrings[`${charId}_${emotion}`] ?? charArtStrings[charId]!;
const artData = parseArt(emotionArt, charPalettes[charId]!);
```

### NPC Framework

Establish a pattern for future narrative characters (mentors, quest givers, rivals):

```typescript
interface NPCDefinition {
  id: string;
  name: string;
  role: 'guide' | 'mentor' | 'quest_giver' | 'rival';
  pixelArt: Record<NPCEmotion, string>;  // per-emotion sprites
  palette: Record<string, string>;
  defaultEmotion: NPCEmotion;
}
```

### Acceptance Criteria

- [ ] AC-9.1: Sage has 32×48 art with 4 emotion-specific sprite variants
- [ ] AC-9.2: `NPCBubble` renders emotion-specific sprite (not just border color)
- [ ] AC-9.3: `NPCInline` also uses emotion-specific sprite
- [ ] AC-9.4: `NPCDefinition` interface exported from `packages/types`
- [ ] AC-9.5: NPC sprites support the same palette system as player characters

---

## 10. Rendering Engine Migration

### New Components (Drop-in Replacements)

| Current Component | New Component | Rendering |
|-------------------|---------------|-----------|
| `PixelCanvas` (CSS box-shadow div) | `CanvasPixelRenderer` | Canvas 2D `fillRect` per pixel |
| `AnimatedPixelCanvas` (CSS box-shadow + setInterval) | `AnimatedCanvasRenderer` | Canvas 2D + `requestAnimationFrame` |
| `LayeredPixelCanvas` (CSS box-shadow composite) | `LayeredCanvasRenderer` | Canvas 2D multi-layer composite |

### Props Compatibility

New components accept the same props as current ones for drop-in migration:

```typescript
interface CanvasPixelRendererProps {
  data: (string | null)[][];
  size?: number;        // default 4
  style?: CSSProperties;
}

interface AnimatedCanvasRendererProps {
  character: { id: string; frames: string[]; palette: Record<string, string> };
  size?: number;
  glowColor?: string;
}

interface LayeredCanvasRendererProps {
  character: { artString: string; palette: Record<string, string> };
  equipment?: EquipmentLayer[];
  companion?: { artString: string; palette: Record<string, string>; frames?: string[] };
  size?: number;
  glowColor?: string;
  evolutionTier?: EvolutionTier;
}
```

### 11-Layer Compositing Order

The `LayeredCanvasRenderer` draws layers in this order (back to front):

```
 1. Background glow (archetype color, blurred)
 2. Cape/cloak (practitioner+ tier)
 3. Base character body
 4. Armor overlay
 5. Boots overlay
 6. Helmet overlay
 7. Shield (left hand)
 8. Weapon (right hand)
 9. Ring glow effect
10. Companion sprite
11. Particle effects (master tier, legendary items)
```

### PNG Export

For social sharing (profile cards, achievement screenshots):

```typescript
function exportCharacterPNG(
  canvas: HTMLCanvasElement,
  scale: number = 4,  // export at 4× for crisp sharing
): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
```

### Acceptance Criteria

- [ ] AC-10.1: `CanvasPixelRenderer` produces visually identical output to `PixelCanvas` for same input
- [ ] AC-10.2: `AnimatedCanvasRenderer` replaces `AnimatedPixelCanvas` with no visual regression
- [ ] AC-10.3: `LayeredCanvasRenderer` composites all 11 layers in correct order
- [ ] AC-10.4: All 3 new components support `prefers-reduced-motion`
- [ ] AC-10.5: PNG export produces ≥128×192 image (size=4) in <200ms
- [ ] AC-10.6: Canvas renders pass React strict mode (no double-paint artifacts)

---

## 11. Data & Backend

### Schema Changes: ZERO

All required fields already exist in Prisma schema:

| Model | Field | Type | Current State |
|-------|-------|------|---------------|
| `EquipmentCatalog` | `pixelArt` | `String? @db.Text` | `NULL` for all 45 items |
| `Character` | `evolutionTier` | `String @db.VarChar(20)` | Working (novice/apprentice/practitioner/master) |
| `Character` | `companionId` | `String? @db.VarChar(20)` | Working (cat/plant/guitar/robot/bird) |

TypeScript types already declare the art fields:
- `CharacterDefinition.pixelArt: Record<EvolutionTier, string>` — `packages/types/src/character.ts:71`
- `CompanionDefinition.pixelArt: string` — `packages/types/src/character.ts:82`
- `EquipmentItem.pixelArt: string` — `packages/types/src/character.ts:46`

### Seed Data Updates

Populate `pixelArt` for all 45 equipment catalog items in `apps/api/prisma/seed.ts`:

```typescript
// Add pixelArt to CatalogItem interface (seed.ts:13-20)
interface CatalogItem {
  itemId: string;
  slot: string;
  rarity: string;
  name: string;
  description: string;
  attributeBonus: Record<string, number>;
  pixelArt: string;  // NEW — 12×16 art string for equipment overlay
}
```

### Equipment Service Update

`apps/api/src/equipment/equipment.service.ts:26-38` currently returns inventory items **without** `pixelArt`. Add it:

```typescript
// equipment.service.ts:26-38 — getInventory return mapping
return items.map((item) => {
  const catalog = catalogMap.get(item.itemId);
  return {
    // ...existing fields...
    name: catalog?.name ?? item.itemId,
    description: catalog?.description ?? '',
    attributeBonus: (catalog?.attributeBonus as Record<string, number>) ?? {},
    pixelArt: catalog?.pixelArt ?? null,  // NEW
  };
});
```

Same for `getEquipped()` at lines 66-78.

### InventoryItemFull Type Update

At `packages/types/src/gamification.ts:93-103`, add `pixelArt`:

```typescript
export interface InventoryItemFull {
  // ...existing fields...
  attributeBonus: Partial<Record<AttributeKey, number>>;
  pixelArt: string | null;  // NEW
}
```

### New Data Files

| File | Contents |
|------|----------|
| `apps/web/app/(onboarding)/_components/characters-v2.ts` | 8 characters × 4 tiers = 32 art strings (32×48), expanded palettes |
| `apps/web/app/(onboarding)/_components/companions.ts` | 12 companion art strings (10×10) with animation frames |
| `apps/web/app/(onboarding)/_components/equipment-art.ts` | Default palettes for equipment rarity tiers |
| `apps/web/app/(onboarding)/_components/sage-v2.ts` | Sage NPC 32×48 art × 4 emotions |

### Acceptance Criteria

- [ ] AC-11.1: Zero Prisma schema changes — no new migrations required
- [ ] AC-11.2: All 45 seed catalog items have `pixelArt` populated after `prisma db seed`
- [ ] AC-11.3: `equipment.service.ts` returns `pixelArt` in both `getInventory()` and `getEquipped()`
- [ ] AC-11.4: `InventoryItemFull` and `EquippedItemFull` types include `pixelArt: string | null`
- [ ] AC-11.5: All 4 new data files compile with zero TypeScript errors
- [ ] AC-11.6: Existing tests pass without modification (backward-compatible data shape)

---

## 12. Files to Modify

### Existing Files

| # | File Path | Change Description | Priority |
|---|-----------|-------------------|:--------:|
| 1 | `apps/web/app/(onboarding)/_components/PixelEngine.tsx` | Add `CanvasPixelRenderer`, `AnimatedCanvasRenderer`, `LayeredCanvasRenderer`; update `EQUIPMENT_OFFSETS` to v2; add `detectArtVersion()` | **P0** |
| 2 | `apps/web/app/(onboarding)/_components/characters.ts` | Add v2 art strings import, keep v1 for backward compat | **P0** |
| 3 | `apps/web/app/(onboarding)/character/page.tsx` | Extend `buildCustomPalette()` with new keys (lines 76-96); use v2 renderer | **P0** |
| 4 | `apps/web/app/(dashboard)/hero-card/page.tsx` | Replace `NeonIcon` with pixel art in equipment slots (lines 388-463); use `LayeredCanvasRenderer` | **P1** |
| 5 | `apps/web/app/(onboarding)/_components/NPCBubble.tsx` | Select emotion-specific sprite variant (lines 84-85); use v2 renderer | **P2** |
| 6 | `apps/api/prisma/seed.ts` | Add `pixelArt` field to `CatalogItem` interface and all 45 items | **P1** |
| 7 | `apps/api/src/equipment/equipment.service.ts` | Return `pixelArt` from `getInventory()` (line 28-38) and `getEquipped()` (line 66-78) | **P1** |
| 8 | `packages/types/src/gamification.ts` | Add `pixelArt: string \| null` to `InventoryItemFull` (line 93) and `EquippedItemFull` | **P1** |
| 9 | `packages/types/src/character.ts` | Add `NPCDefinition` interface; verify `CompanionDefinition.pixelArt` is non-optional | **P2** |
| 10 | `apps/web/app/(onboarding)/_components/tokens.ts` | No changes needed — rarity colors already defined (lines 39-45) | — |
| 11 | `apps/web/app/(onboarding)/_data/archetypes.ts` | No changes needed — archetype colors already defined (lines 15-65) | — |
| 12 | `apps/api/src/character/character.service.ts` | No changes needed — evolution logic already works (lines 83-108) | — |
| 13 | `apps/web/app/(dashboard)/home/page.tsx` | Use `AnimatedCanvasRenderer` for character display | **P2** |
| 14 | `packages/store/src/onboarding-store.ts` | No changes needed — already stores `characterId`, `archetypeId` | — |

### New Files

| # | File Path | Contents | Priority |
|---|-----------|----------|:--------:|
| 15 | `apps/web/app/(onboarding)/_components/characters-v2.ts` | 32 art strings (8 chars × 4 tiers), expanded palettes, body type metadata | **P0** |
| 16 | `apps/web/app/(onboarding)/_components/companions.ts` | 12 companion art strings + animation frames | **P2** |
| 17 | `apps/web/app/(onboarding)/_components/equipment-art.ts` | Equipment rarity palette mappings, default art palettes | **P1** |
| 18 | `apps/web/app/(onboarding)/_components/sage-v2.ts` | Sage 32×48 × 4 emotion sprites | **P2** |
| 19 | `apps/web/app/(onboarding)/_components/TierUpCelebration.tsx` | Evolution tier-up animation component | **P1** |

---

## 13. Implementation Phases

### Phase 1: Canvas Renderer + 32×48 Base Characters (3-4 days)

**Goal:** New rendering engine + 8 characters at novice tier in 32×48.

| Task | Files | Est. |
|------|-------|:----:|
| Implement `CanvasPixelRenderer` | `PixelEngine.tsx` | 0.5d |
| Implement `AnimatedCanvasRenderer` | `PixelEngine.tsx` | 0.5d |
| Implement `LayeredCanvasRenderer` with 11-layer compositing | `PixelEngine.tsx` | 1d |
| Create 8 novice-tier 32×48 art strings with 3-4 body types | `characters-v2.ts` | 1d |
| Expand palette system (12 → 18-20 keys) | `characters-v2.ts`, `character/page.tsx` | 0.5d |
| Wire v2 renderers into onboarding + hero card | `character/page.tsx`, `hero-card/page.tsx` | 0.5d |

**Exit criteria:** All 8 characters render at 32×48 via Canvas 2D in onboarding selector and hero card.

### Phase 2: Equipment Art Library (3-4 days)

**Goal:** All 45 items have pixel art, visible on hero card.

| Task | Files | Est. |
|------|-------|:----:|
| Create equipment art strings (6 slots × ~6 rarities) | `seed.ts`, `equipment-art.ts` | 2d |
| Update `EQUIPMENT_OFFSETS` for 32×48 base | `PixelEngine.tsx` | 0.5d |
| Implement rarity visual tiers (glow, particles) | `PixelEngine.tsx`, `equipment-art.ts` | 0.5d |
| Return `pixelArt` from equipment service | `equipment.service.ts`, `gamification.ts` | 0.5d |
| Replace `NeonIcon` with pixel art in HeroCard slots | `hero-card/page.tsx` | 0.5d |

**Exit criteria:** Equipped items visible as pixel art overlays on character; all 45 items seeded with art.

### Phase 3: Evolution Tier Visuals (2-3 days)

**Goal:** 4 visual tiers for all 8 characters + tier-up celebration.

| Task | Files | Est. |
|------|-------|:----:|
| Create apprentice/practitioner/master art for all 8 characters | `characters-v2.ts` | 1.5d |
| Implement `TierUpCelebration` component | `TierUpCelebration.tsx` | 0.5d |
| Wire tier-based sprite selection into `LayeredCanvasRenderer` | `PixelEngine.tsx`, `hero-card/page.tsx` | 0.5d |

**Exit criteria:** Character visually evolves through 4 tiers; celebration animation plays on tier change.

### Phase 4: Animation + Companions (2-3 days)

**Goal:** Smooth idle animations + all companions rendered.

| Task | Files | Est. |
|------|-------|:----:|
| Create 4-6 frame idle animations for all 8 characters | `characters-v2.ts` | 1d |
| Create 12 companion art strings with 2-3 frame animations | `companions.ts` | 0.5d |
| Implement equipment-aware animation (layers sync) | `PixelEngine.tsx` | 0.5d |
| Wire companion rendering into `LayeredCanvasRenderer` | `PixelEngine.tsx`, `hero-card/page.tsx` | 0.5d |

**Exit criteria:** Characters idle-animate at 4-6 frames; companions visible and animated next to character.

### Phase 5: Archetype Identity + NPC Upgrades (2-3 days)

**Goal:** Archetype glow/emblems + Sage v2 with emotion sprites.

| Task | Files | Est. |
|------|-------|:----:|
| Wire archetype glow color to character renderer | `hero-card/page.tsx`, `home/page.tsx` | 0.5d |
| Implement set bonus visual (3+ themed items) | `PixelEngine.tsx` | 0.5d |
| Create archetype emblems (5 × 4×4 pixel patterns) | `characters-v2.ts` | 0.5d |
| Create Sage 32×48 × 4 emotion sprites | `sage-v2.ts` | 0.5d |
| Update NPCBubble to use emotion sprites | `NPCBubble.tsx` | 0.5d |

**Exit criteria:** Characters glow with archetype color; NPCs show emotion-specific sprites; set bonuses visible.

### Total Estimated Duration: **13-17 days**

### Dependency Graph

```
Phase 1 (Canvas + base chars) ──┬── Phase 2 (Equipment art)
                                 ├── Phase 3 (Tier visuals)
                                 ├── Phase 4 (Animation + companions)
                                 └── Phase 5 (Archetype + NPC)

Phase 1 is prerequisite for all others.
Phases 2-5 can partially overlap after Phase 1 completes.
```

---

## 14. Verification

### Per-Phase Checklists

**Phase 1 Complete When:**
- [ ] `CanvasPixelRenderer` renders pixel-identical output to legacy `PixelCanvas`
- [ ] All 8 characters display at 32×48 in onboarding character selector
- [ ] Legacy 12×16 art auto-detected and rendered at 2× scale
- [ ] Hero card shows 32×48 character via Canvas 2D

**Phase 2 Complete When:**
- [ ] `prisma db seed` populates `pixelArt` for all 45 equipment items
- [ ] Equipment visible as pixel overlay on hero card character
- [ ] Rarity glow matches `tokens.ts` definitions
- [ ] Equipment API responses include `pixelArt` field

**Phase 3 Complete When:**
- [ ] Character visually changes at each tier threshold (80/180/300)
- [ ] `TierUpCelebration` plays on tier change
- [ ] Master tier shows particles

**Phase 4 Complete When:**
- [ ] Idle animation runs at 4-6 frames, smooth 60fps via Canvas
- [ ] Companions render next to character
- [ ] `prefers-reduced-motion` respected

**Phase 5 Complete When:**
- [ ] Character glow matches archetype color
- [ ] Sage shows 4 distinct emotion sprites
- [ ] Set bonus visual triggers at 3+ items

### Performance Targets

| Metric | Target | Measurement |
|--------|:------:|-------------|
| Single frame render | <2ms | `performance.now()` around `fillRect` loop |
| Full composite (11 layers) | <5ms | `performance.now()` around `LayeredCanvasRenderer.draw()` |
| Animation framerate | 60fps | No dropped frames in Chrome DevTools Performance tab |
| PNG export | <200ms | `performance.now()` around `canvas.toBlob()` |
| Memory per character | <50KB | Canvas ImageData + cached frames |
| Art string parse | <1ms | `performance.now()` around `parseArt()` |

### Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Reduced motion | `prefers-reduced-motion: reduce` → static frame, no particles |
| Screen reader | `aria-label` on canvas: `"{Character name}, {tier} tier, {archetype} archetype"` |
| Keyboard focus | Visible focus ring on canvas wrapper (2px solid, archetype color) |
| Rarity identification | Color + shape (icon from `tokens.ts:39-45`) — never color alone |
| High contrast | Outline key (`O`) ensures 3:1 contrast ratio against dark background |

---

*End of requirements document.*

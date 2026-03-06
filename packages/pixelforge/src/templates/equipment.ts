// ═══════════════════════════════════════════
// EQUIPMENT TEMPLATES — procedurally generated sprites
// Base shapes per slot + rarity visual modifiers
//
// Each slot has 1-2 base shapes. Specific items are variants
// created by applying rarity palettes + accent pixels.
// ═══════════════════════════════════════════

import type { EquipmentSlot, Rarity, Palette } from '../types';
import { lighten, darken } from '../color';

// ─── Base Shape Art Strings ──────────────────────────────────

/** Base art strings per slot. Key char legend:
 *  B = body (main color), D = dark/shadow, L = light/highlight,
 *  X = accent (rarity-dependent), G = gem/glow, . = transparent */

const WEAPON_SHAPES: string[] = [
  // Shape 0: Blade (sword-like)
  [
    '....BL',
    '...BBL',
    '..BBD.',
    '.BBD..',
    'BBD...',
    'XDD...',
    '.DX...',
    '..D...',
    '..X...',
    '..D...',
  ].join('\n'),
  // Shape 1: Staff (pole-like)
  [
    '..BL..',
    '..BB..',
    '..BD..',
    '..BD..',
    '..BD..',
    '..BD..',
    '..BD..',
    '..BD..',
    '.XBD..',
    '.XDD..',
  ].join('\n'),
];

const SHIELD_SHAPES: string[] = [
  // Shape 0: Round shield
  [
    '.BBBB.',
    'BBBBB.',
    'BBXBBD',
    'BBBBBD',
    'BBBBD.',
    'BBBBD.',
    '.BBBD.',
    '..DD..',
  ].join('\n'),
];

const ARMOR_SHAPES: string[] = [
  // Shape 0: Chestplate
  [
    '..BBBBBB..',
    '.BBBBBBBB.',
    'BBLBBBBLD.',
    'BBBXBBXBBD',
    'BBBBBBBBD.',
    '.BBBBBBD..',
  ].join('\n'),
];

const HELMET_SHAPES: string[] = [
  // Shape 0: Cap/helm
  [
    '..BBBB..',
    '.BBLBBB.',
    'BBBBBBBD',
    '.XDDDDX.',
  ].join('\n'),
];

const BOOTS_SHAPES: string[] = [
  // Shape 0: Pair of boots
  [
    'BB...BB.',
    'BBD.BBD.',
    'BBBXBBBX',
  ].join('\n'),
];

const RING_SHAPES: string[] = [
  // Shape 0: Simple ring
  [
    '.B.',
    'BXB',
    '.B.',
  ].join('\n'),
];

const COMPANION_SHAPES: string[] = [
  // Shape 0: Cat silhouette
  [
    'B.....B.',
    'BB...BB.',
    '.BBBBB..',
    '.BBXBB..',
    '.BBBBB..',
    'BBBBBBB.',
    '.BBBBB..',
    '..B..B..',
  ].join('\n'),
  // Shape 1: Bird silhouette
  [
    '..BB....',
    '.BXBB...',
    '.BBBBB..',
    '..BBBB..',
    '..BBB...',
    '...BBB..',
    '...B.B..',
    '........',
  ].join('\n'),
  // Shape 2: Fox silhouette
  [
    '.BB..BB.',
    '.BBB.BB.',
    '.BBBBB..',
    '.BBXBB..',
    '.BBBBB..',
    '..BBBBB.',
    '..BBBB..',
    '...B.B..',
  ].join('\n'),
  // Shape 3: Dragon silhouette
  [
    '.B.B....',
    'BBBBB...',
    'BBBXBB..',
    '.BBBBBB.',
    '..BBBBB.',
    '...BBB..',
    '...BB...',
    '..B..B..',
  ].join('\n'),
  // Shape 4: Phoenix silhouette
  [
    '..BBB...',
    '.BXBBB..',
    'BBBBBBB.',
    '.BBBBBB.',
    '..BBBBB.',
    '...BBBB.',
    '..BB.BB.',
    '.B....B.',
  ].join('\n'),
];

const BASE_SHAPES: Record<EquipmentSlot, string[]> = {
  weapon: WEAPON_SHAPES,
  shield: SHIELD_SHAPES,
  armor: ARMOR_SHAPES,
  helmet: HELMET_SHAPES,
  boots: BOOTS_SHAPES,
  ring: RING_SHAPES,
  companion: COMPANION_SHAPES,
};

// ─── Rarity Color Schemes ────────────────────────────────────

interface RarityColors {
  accent: string;     // X chars in base shape
  glow: string | null; // CSS glow for rendering
  accentCount: number; // how many accent pixels to add beyond base
}

const RARITY_COLORS: Record<Rarity, RarityColors> = {
  common:    { accent: '#71717A', glow: null,                          accentCount: 0 },
  uncommon:  { accent: '#6EE7B7', glow: null,                          accentCount: 1 },
  rare:      { accent: '#3B82F6', glow: 'rgba(59,130,246,0.3)',        accentCount: 2 },
  epic:      { accent: '#9D7AFF', glow: 'rgba(157,122,255,0.3)',       accentCount: 3 },
  legendary: { accent: '#FFD166', glow: 'rgba(255,209,102,0.4)',       accentCount: 4 },
};

// ─── Slot-Specific Base Colors ────────────────────────────────

interface SlotColorScheme {
  base: string;      // B chars
  dark: string;      // D chars
  light: string;     // L chars
}

const SLOT_COLORS: Record<EquipmentSlot, SlotColorScheme> = {
  weapon:    { base: '#A0A8B8', dark: '#707888', light: '#C8D0E0' },
  shield:    { base: '#8B7355', dark: '#6B5535', light: '#AB9375' },
  armor:     { base: '#7A6B5E', dark: '#5A4B3E', light: '#9A8B7E' },
  helmet:    { base: '#8890A0', dark: '#686878', light: '#A8B0C0' },
  boots:     { base: '#6B5040', dark: '#4B3020', light: '#8B7060' },
  ring:      { base: '#B87333', dark: '#985313', light: '#D89353' },
  companion: { base: '#D0A080', dark: '#B08060', light: '#F0C0A0' },
};

// ─── Equipment Generation ────────────────────────────────────

/**
 * Build a palette for an equipment item given its slot and rarity.
 */
export function buildEquipmentPalette(
  slot: EquipmentSlot,
  rarity: Rarity,
): Palette {
  const base = SLOT_COLORS[slot];
  const rarityConfig = RARITY_COLORS[rarity];

  // Higher rarities get brighter base colors
  const rarityBrightness = { common: 0, uncommon: 5, rare: 10, epic: 15, legendary: 20 };
  const brightness = rarityBrightness[rarity];

  return {
    B: lighten(base.base, brightness),
    D: lighten(base.dark, brightness),
    L: lighten(base.light, brightness),
    X: rarityConfig.accent,
    G: rarityConfig.accent,
  };
}

/**
 * Select a base shape for an equipment item.
 * Uses the itemId hash to deterministically pick a variant.
 */
function selectShape(slot: EquipmentSlot, itemId: string): string {
  const shapes = BASE_SHAPES[slot];
  // Simple hash to pick shape variant
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) {
    hash = ((hash << 5) - hash + itemId.charCodeAt(i)) | 0;
  }
  return shapes[Math.abs(hash) % shapes.length]!;
}

/**
 * Apply rarity-based visual enhancements to an equipment art string.
 * Higher rarities add more accent pixels at strategic positions.
 */
function applyRarityEnhancements(
  artString: string,
  rarity: Rarity,
): string {
  if (rarity === 'common') return artString;

  const config = RARITY_COLORS[rarity];
  const rows = artString.split('\n');

  // Add accent pixels by converting some 'B' to 'X' at edges
  let added = 0;
  for (let y = 0; y < rows.length && added < config.accentCount; y++) {
    const row = rows[y];
    if (!row) continue;
    const chars = [...row];
    for (let x = 0; x < chars.length && added < config.accentCount; x++) {
      // Convert edge 'B' pixels (adjacent to '.') to 'X'
      if (chars[x] === 'B') {
        const hasTransparentNeighbor =
          (x > 0 && chars[x - 1] === '.') ||
          (x < chars.length - 1 && chars[x + 1] === '.') ||
          (y > 0 && rows[y - 1]?.[x] === '.') ||
          (y < rows.length - 1 && rows[y + 1]?.[x] === '.');
        if (hasTransparentNeighbor) {
          chars[x] = 'X';
          added++;
        }
      }
    }
    rows[y] = chars.join('');
  }

  return rows.join('\n');
}

/**
 * Generate a complete equipment sprite (art string + palette) for a specific item.
 */
export function generateEquipmentSprite(
  itemId: string,
  slot: EquipmentSlot,
  rarity: Rarity,
): { artString: string; palette: Palette; glow: string | null } {
  const baseShape = selectShape(slot, itemId);
  const enhanced = applyRarityEnhancements(baseShape, rarity);
  const palette = buildEquipmentPalette(slot, rarity);
  const glow = RARITY_COLORS[rarity].glow;

  return { artString: enhanced, palette, glow };
}

/**
 * Get all available base shapes for a slot (for preview/catalog).
 */
export function getBaseShapes(slot: EquipmentSlot): string[] {
  return BASE_SHAPES[slot];
}

/**
 * Get rarity visual config.
 */
export function getRarityColors(rarity: Rarity): RarityColors {
  return RARITY_COLORS[rarity];
}

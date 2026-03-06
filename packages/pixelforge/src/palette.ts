// ═══════════════════════════════════════════
// PALETTE — build, swap, and modify palettes
// Supports both v1 (12-key) and v2 (22-key with digit aliases)
// ═══════════════════════════════════════════

import type { Palette, SkinTone, HairColor, OutfitColor } from './types';
import { lighten, darken } from './color';

// ─── Predefined Swatches ──────────────────────────────────────

export const SKIN_TONES: SkinTone[] = [
  { id: 'light',     color: '#FFE0C0', blush: '#FFBBA0', mouth: '#E8907A' },
  { id: 'fair',      color: '#FFDAB9', blush: '#FFB5A0', mouth: '#E8907A' },
  { id: 'medium',    color: '#DEB887', blush: '#D4A06A', mouth: '#C08060' },
  { id: 'olive',     color: '#D2A37C', blush: '#C0905A', mouth: '#A87848' },
  { id: 'tan',       color: '#D4A574', blush: '#C89058', mouth: '#B07848' },
  { id: 'brown',     color: '#C68642', blush: '#B87530', mouth: '#A06828' },
  { id: 'dark',      color: '#8B5E3C', blush: '#7A4E2C', mouth: '#6A3E20' },
  { id: 'deep',      color: '#7B4B2A', blush: '#6A3B1A', mouth: '#5A3018' },
];

export const HAIR_COLORS: HairColor[] = [
  { id: 'blonde',    H: '#E8C35A', h: '#C9A530' },
  { id: 'brown',     H: '#5C3A1E', h: '#4A2E16' },
  { id: 'black',     H: '#1A1008', h: '#0E0804' },
  { id: 'auburn',    H: '#CC4422', h: '#AA3818' },
  { id: 'purple',    H: '#6B48A8', h: '#553890' },
  { id: 'dark_blue', H: '#1A1A2E', h: '#121220' },
  { id: 'pink',      H: '#D06090', h: '#B04878' },
  { id: 'silver',    H: '#B0B8C8', h: '#909AA8' },
];

export const OUTFIT_COLORS: OutfitColor[] = [
  { id: 'violet',  T: '#9D7AFF', t_dark: '#7B5FCC' },
  { id: 'teal',    T: '#2A9D8F', t_dark: '#1A7A6A' },
  { id: 'magenta', T: '#E879F9', t_dark: '#C060D0' },
  { id: 'blue',    T: '#3B82F6', t_dark: '#2A60C0' },
  { id: 'rose',    T: '#FF6B8A', t_dark: '#D04A6A' },
  { id: 'cyan',    T: '#4ECDC4', t_dark: '#3AABA0' },
  { id: 'gold',    T: '#FFD166', t_dark: '#E0B040' },
  { id: 'indigo',  T: '#818CF8', t_dark: '#6060D0' },
];

// ─── Palette Builders ─────────────────────────────────────────

/**
 * Build a v1 palette (12 keys) from component choices.
 * Works with 12×16 art strings.
 */
export function createPaletteV1(
  skinTone: SkinTone,
  hairColor: HairColor,
  outfitColor: OutfitColor,
): Palette {
  return {
    H: hairColor.H,
    h: hairColor.h,
    S: skinTone.color,
    A: skinTone.color,
    E: '#2A2040',
    w: '#FFFFFF',
    r: skinTone.blush,
    m: skinTone.mouth,
    T: outfitColor.T,
    t: outfitColor.t_dark,
    P: outfitColor.t_dark,
    F: outfitColor.t_dark,
  };
}

/**
 * Build a v2 palette (22 keys including digit aliases) from component choices.
 * Works with 32×48 art strings.
 */
export function createPaletteV2(
  skinTone: SkinTone,
  hairColor: HairColor,
  outfitColor: OutfitColor,
): Palette {
  return {
    // Standard keys (v1 compatible)
    H: hairColor.H,
    h: hairColor.h,
    S: skinTone.color,
    A: skinTone.color,
    E: '#1A1020',
    w: '#FFFFFF',
    r: skinTone.blush,
    m: skinTone.mouth,
    T: outfitColor.T,
    t: outfitColor.t_dark,
    P: outfitColor.t_dark,
    F: outfitColor.t_dark,
    // Digit-alias keys (v2 extended)
    '1': lighten(hairColor.H, 20),
    '2': darken(skinTone.color, 15),
    '3': lighten(skinTone.color, 15),
    '4': '#0A0A12',
    '5': '#F0F0F5',
    '6': outfitColor.t_dark,
    '7': lighten(outfitColor.T, 15),
    '8': darken(outfitColor.t_dark, 15),
    '9': darken(skinTone.color, 20),
    '0': darken(outfitColor.t_dark, 20),
    O: '#1A1020',
  };
}

/**
 * Darken all colors in a palette by a factor.
 */
export function darkenPalette(palette: Palette, percent: number): Palette {
  const result: Palette = {};
  for (const [key, value] of Object.entries(palette)) {
    result[key] = darken(value, percent);
  }
  return result;
}

/**
 * Lighten all colors in a palette by a factor.
 */
export function lightenPalette(palette: Palette, percent: number): Palette {
  const result: Palette = {};
  for (const [key, value] of Object.entries(palette)) {
    result[key] = lighten(value, percent);
  }
  return result;
}

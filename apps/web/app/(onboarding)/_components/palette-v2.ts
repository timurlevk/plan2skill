// ═══════════════════════════════════════════
// PALETTE V2 — Extended palette system for 32×48 characters
// Core detection + offsets delegated to @plan2skill/pixelforge
// ═══════════════════════════════════════════

import { lighten, darken } from '@plan2skill/pixelforge';
export { detectArtVersion, getAdjustedSize, EQUIPMENT_OFFSETS_V2 } from '@plan2skill/pixelforge';

// ─── Custom Palette Builder (v2) ───
// App-specific: uses skinTone/hair/shirt interface shape
// different from the library's generic createPaletteV2

export function buildCustomPaletteV2(
  bodyId: string,
  skinTone: { color: string; blush: string; mouth: string },
  hairColor: { H: string; h: string },
  shirtColor: { T: string; t_dark: string },
): Record<string, string> {
  return {
    // Standard v1 keys
    H: hairColor.H,
    h: hairColor.h,
    S: skinTone.color,
    A: skinTone.color,
    E: '#1A1020',
    w: '#FFFFFF',
    r: skinTone.blush,
    m: skinTone.mouth,
    T: shirtColor.T,
    t: shirtColor.t_dark,
    P: shirtColor.t_dark,
    F: shirtColor.t_dark,
    // Digit-alias keys (v2 extended palette)
    '1': lighten(hairColor.H, 20),    // Hh — hair highlight
    '2': darken(skinTone.color, 15),   // Ss — skin shadow
    '3': lighten(skinTone.color, 15),  // Sl — skin highlight
    '4': '#0A0A12',                    // Ep — eye pupil
    '5': '#F0F0F5',                    // Ew — eye white
    '6': shirtColor.t_dark,            // Tt — outfit shadow
    '7': lighten(shirtColor.T, 15),    // Tl — outfit highlight
    '8': darken(shirtColor.t_dark, 15),// Pp — pants shadow
    '9': darken(skinTone.color, 20),   // Aa — accent shadow
    '0': darken(shirtColor.t_dark, 20),// Ff — feet shadow
    O: '#1A1020',                      // outline
  };
}

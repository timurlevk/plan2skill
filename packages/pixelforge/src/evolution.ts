// ═══════════════════════════════════════════
// EVOLUTION — tier-based visual upgrades
// Modifies character art strings to add progression visuals
// ═══════════════════════════════════════════

import type { EvolutionTier, Palette } from './types';
import { lighten } from './color';

/** Evolution tier thresholds (total attribute points) */
export const EVOLUTION_THRESHOLDS: Record<EvolutionTier, number> = {
  novice: 0,
  apprentice: 80,
  practitioner: 180,
  master: 300,
};

/** Get evolution tier from total attribute points */
export function getEvolutionTier(totalAttributes: number): EvolutionTier {
  if (totalAttributes >= 300) return 'master';
  if (totalAttributes >= 180) return 'practitioner';
  if (totalAttributes >= 80) return 'apprentice';
  return 'novice';
}

/**
 * Apply evolution tier visual modifiers to a v2 art string.
 * - Novice: base character, no extras
 * - Apprentice: shoulder accent pixels (palette key 'G' = gold accent)
 * - Practitioner: cape fragment (extends body rows)
 * - Master: full cape + crown/halo accent
 *
 * Returns modified art string + palette additions.
 */
export function applyEvolutionVisuals(
  artString: string,
  palette: Palette,
  tier: EvolutionTier,
): { artString: string; palette: Palette } {
  if (tier === 'novice') return { artString, palette };

  const rows = artString.trim().split('\n');
  const newPalette = { ...palette };

  if (tier === 'apprentice' || tier === 'practitioner' || tier === 'master') {
    // Add gold accent color for shoulder decoration
    newPalette['G'] = '#FFD166';

    // Shoulder accent: rows 16-17 (shoulder area in v2)
    // Add 'G' pixels at the outer edges of the shoulder row
    for (const rowIdx of [16, 17]) {
      const row = rows[rowIdx];
      if (row) {
        const chars = [...row];
        // Find first and last non-'.' char positions
        const firstSolid = chars.findIndex((c) => c !== '.');
        const lastSolid = chars.length - 1 - [...chars].reverse().findIndex((c) => c !== '.');
        if (firstSolid > 0 && lastSolid < chars.length - 1) {
          chars[firstSolid - 1] = 'G';
          chars[lastSolid + 1] = 'G';
          rows[rowIdx] = chars.join('');
        }
      }
    }
  }

  if (tier === 'practitioner' || tier === 'master') {
    // Cape accent color
    newPalette['C'] = lighten(palette['T'] ?? '#9D7AFF', 10);

    // Cape fragment: add 'C' pixels behind the torso (rows 18-28)
    for (let rowIdx = 18; rowIdx <= 28; rowIdx++) {
      const capeRow = rows[rowIdx];
      if (capeRow) {
        const chars = [...capeRow];
        const firstSolid = chars.findIndex((c) => c !== '.');
        const lastSolid = chars.length - 1 - [...chars].reverse().findIndex((c) => c !== '.');
        // Add cape pixels 1-2 px outside the body
        if (firstSolid > 1) {
          chars[firstSolid - 1] = 'C';
          if (firstSolid > 2) chars[firstSolid - 2] = 'C';
        }
        if (lastSolid < chars.length - 2) {
          chars[lastSolid + 1] = 'C';
          if (lastSolid < chars.length - 3) chars[lastSolid + 2] = 'C';
        }
        rows[rowIdx] = chars.join('');
      }
    }
  }

  if (tier === 'master') {
    // Crown/halo: add golden pixels above the head (row 0-1)
    newPalette['W'] = '#FFE580'; // crown color (warm gold)

    // Crown: 5 accent pixels centered on head
    if (rows[0]) {
      const chars = [...rows[0]];
      const mid = Math.floor(chars.length / 2);
      chars[mid - 2] = 'W';
      chars[mid] = 'W';
      chars[mid + 2] = 'W';
      rows[0] = chars.join('');
    }
    if (rows[1]) {
      const chars = [...rows[1]];
      const mid = Math.floor(chars.length / 2);
      chars[mid - 1] = 'W';
      chars[mid + 1] = 'W';
      rows[1] = chars.join('');
    }
  }

  return { artString: rows.join('\n'), palette: newPalette };
}

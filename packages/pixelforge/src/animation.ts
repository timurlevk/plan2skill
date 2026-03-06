// ═══════════════════════════════════════════
// ANIMATION — idle and breathing frame generation
// Extracted from CanvasPixelRenderer.tsx buildIdleFrames()
// Framework-agnostic, returns art string frames
// ═══════════════════════════════════════════

import type { ArtVersion } from './types';
import { detectArtVersion } from './parser';

/** Default milliseconds per frame for idle breathing */
export const IDLE_MS_PER_FRAME = 1500;

/**
 * Generate 2-frame idle breathing animation from a base art string.
 * Frame 0: original
 * Frame 1: slight shift on the "breathing row" (torso area)
 *
 * v1 (12×16): breathing row = 11
 * v2 (32×48): breathing row = ~70% height (row 33)
 */
export function buildIdleFrames(baseString: string): string[] {
  const rows = baseString.trim().split('\n');
  const version = detectArtVersion(baseString);

  const frame0 = rows.join('\n');

  // Determine breathing row based on version
  const breathRow = version === 'v1' ? 11 : Math.floor(rows.length * 0.7);
  const r = [...rows];

  if (r[breathRow]) {
    const chars = [...r[breathRow]];
    // Subtle shift: if first char is '.', make it space (slight right-shift)
    if (chars[0] === '.') {
      chars[0] = ' ';
    }
    r[breathRow] = chars.join('');
  }

  return [frame0, r.join('\n')];
}

/**
 * Get the breathing row index for a given art version.
 * v1: row 11 (of 16), v2: 70% of height.
 * Optional rowCount for non-standard sizes; defaults to 16 (v1) or 48 (v2).
 */
export function getBreathRow(version: ArtVersion, rowCount?: number): number {
  if (version === 'v1') return 11;
  const rows = rowCount ?? 48;
  return Math.floor(rows * 0.7);
}

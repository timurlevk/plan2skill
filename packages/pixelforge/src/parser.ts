// ═══════════════════════════════════════════
// PARSER — art string ↔ pixel grid conversion
// Extracted from PixelEngine.tsx
// ═══════════════════════════════════════════

import type { Palette, PixelGrid, ArtVersion } from './types';

/**
 * Parse an art string into a 2D color grid.
 * Each char maps to a palette color; '.' = transparent.
 */
export function parseArt(str: string, palette: Palette): PixelGrid {
  return str
    .trim()
    .split('\n')
    .map((row) =>
      [...row.trim()].map((c) => (c === '.' ? null : palette[c] ?? null)),
    );
}

/**
 * Parse with namespaced palette keys (for equipment overlays).
 * Tries `${namespace}_${char}` first, falls back to `palette[char]`.
 */
export function parseArtNamespaced(
  str: string,
  palette: Palette,
  namespace: string,
): PixelGrid {
  return str
    .trim()
    .split('\n')
    .map((row) =>
      [...row.trim()].map((c) =>
        c === '.' ? null : palette[`${namespace}_${c}`] ?? palette[c] ?? null,
      ),
    );
}

/**
 * Detect art version from string dimensions.
 * v1 = 12×16 (≤20 rows), v2 = 32×48 (>20 rows).
 */
export function detectArtVersion(artString: string): ArtVersion {
  const rows = artString.trim().split('\n');
  return rows.length <= 20 ? 'v1' : 'v2';
}

/**
 * Get pixel size adjustment for rendering.
 * v1 art is upscaled 2× to match v2 visual size.
 */
export function getAdjustedSize(artString: string, size: number): number {
  return detectArtVersion(artString) === 'v1' ? size * 2 : size;
}

/**
 * Normalize art string: ensure every row is exactly `w` chars, pad with '.'.
 */
export function normalizeArt(rows: string[], w = 32, h = 48): string {
  const out: string[] = [];
  for (let i = 0; i < h; i++) {
    const r = (rows[i] ?? '').replace(/\s/g, '');
    out.push(r.length >= w ? r.slice(0, w) : r.padEnd(w, '.'));
  }
  return out.join('\n');
}

/**
 * Serialize a PixelGrid back to an art string + palette.
 * Inverse of parseArt — useful for saving generated characters.
 */
export function gridToArtString(
  grid: PixelGrid,
  palette: Palette,
): string {
  // Build reverse map: hex color → palette key
  const colorToKey: Record<string, string> = {};
  for (const [key, color] of Object.entries(palette)) {
    // First key wins (for overlapping colors)
    if (!colorToKey[color.toLowerCase()]) {
      colorToKey[color.toLowerCase()] = key;
    }
  }

  return grid
    .map((row) =>
      row.map((c) => (c ? colorToKey[c.toLowerCase()] ?? '.' : '.')).join(''),
    )
    .join('\n');
}

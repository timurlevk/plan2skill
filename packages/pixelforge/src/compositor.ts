// ═══════════════════════════════════════════
// COMPOSITOR — layer compositing for character + equipment
// Extracted from PixelEngine.tsx compositeArt()
// Framework-agnostic, pure data transformation
// ═══════════════════════════════════════════

import type { PixelGrid, CompositeLayer, EquipmentLayer, Palette, ArtVersion } from './types';
import { parseArt, detectArtVersion } from './parser';

// ─── Equipment Offsets ────────────────────────────────────────

/** Equipment slot offsets for v1 (12×16 base) */
export const EQUIPMENT_OFFSETS_V1: Record<string, { x: number; y: number }> = {
  helmet:    { x: 2,  y: -2 },
  armor:     { x: 1,  y: 9 },
  weapon:    { x: 10, y: 7 },
  shield:    { x: -2, y: 7 },
  boots:     { x: 2,  y: 14 },
  ring:      { x: 10, y: 10 },
  companion: { x: -5, y: 10 },
};

/** Equipment slot offsets for v2 (32×48 base) */
export const EQUIPMENT_OFFSETS_V2: Record<string, { x: number; y: number }> = {
  helmet:    { x: 5,  y: -3 },
  armor:     { x: 3,  y: 14 },
  weapon:    { x: 25, y: 16 },
  shield:    { x: -4, y: 16 },
  boots:     { x: 5,  y: 38 },
  ring:      { x: 26, y: 28 },
  companion: { x: -14, y: 30 },
};

/** Get equipment offsets for the given art version */
export function getEquipmentOffsets(
  version: ArtVersion,
): Record<string, { x: number; y: number }> {
  return version === 'v1' ? EQUIPMENT_OFFSETS_V1 : EQUIPMENT_OFFSETS_V2;
}

// ─── Composite Engine ─────────────────────────────────────────

/**
 * Composite a base grid with multiple overlay layers.
 * Later layers paint over earlier ones.
 * Handles negative offsets (equipment extending beyond character bounds).
 */
export function composite(
  baseData: PixelGrid,
  layers: CompositeLayer[],
): PixelGrid {
  // Determine total canvas bounds
  let minX = 0, minY = 0;
  let maxX = baseData[0]?.length ?? 0;
  let maxY = baseData.length;

  for (const layer of layers) {
    const lw = layer.data[0]?.length ?? 0;
    const lh = layer.data.length;
    minX = Math.min(minX, layer.offsetX);
    minY = Math.min(minY, layer.offsetY);
    maxX = Math.max(maxX, layer.offsetX + lw);
    maxY = Math.max(maxY, layer.offsetY + lh);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const baseOffX = -minX;
  const baseOffY = -minY;

  // Create empty canvas
  const canvas: PixelGrid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null),
  );

  // Paint base character
  for (let y = 0; y < baseData.length; y++) {
    const row = baseData[y]!;
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c) {
        const cy = y + baseOffY;
        const cx = x + baseOffX;
        if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
          canvas[cy]![cx] = c;
        }
      }
    }
  }

  // Paint equipment layers (later = on top)
  for (const layer of layers) {
    for (let y = 0; y < layer.data.length; y++) {
      const row = layer.data[y]!;
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c) {
          const cy = y + layer.offsetY + baseOffY;
          const cx = x + layer.offsetX + baseOffX;
          if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
            canvas[cy]![cx] = c;
          }
        }
      }
    }
  }

  return canvas;
}

/**
 * Composite character art string + equipment layers into a single PixelGrid.
 * High-level wrapper that handles parsing and offset lookup.
 * Auto-detects art version from the character art string if not specified.
 */
export function compositeCharacterWithEquipment(
  charArtString: string,
  charPalette: Palette,
  equipment: EquipmentLayer[],
  version?: ArtVersion,
): PixelGrid {
  const baseData = parseArt(charArtString, charPalette);
  const resolvedVersion = version ?? detectArtVersion(charArtString);
  const offsets = getEquipmentOffsets(resolvedVersion);

  const layers: CompositeLayer[] = equipment.map((eq) => {
    const offset = offsets[eq.slot] ?? { x: 0, y: 0 };
    return {
      data: parseArt(eq.artString, eq.palette),
      offsetX: offset.x,
      offsetY: offset.y,
    };
  });

  return composite(baseData, layers);
}

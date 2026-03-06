// ═══════════════════════════════════════════
// SEED — deterministic parameter generation
// Same seed always produces the same character
// ═══════════════════════════════════════════

import type { BodyId, CharacterParams, EvolutionTier } from './types';
import { SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from './palette';

const BODY_IDS: BodyId[] = ['aria', 'kofi', 'mei', 'diego', 'zara', 'alex', 'priya', 'liam'];

/** djb2 hash — fast, good distribution for short strings */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure unsigned
}

/** Convert any seed to a positive integer */
function seedToNumber(seed: string | number): number {
  if (typeof seed === 'number') return Math.abs(seed) >>> 0;
  return djb2(seed);
}

/** Extract N-th parameter from seed using bit shifting */
function pick<T>(items: readonly T[], hash: number, index: number): T {
  // Use different bit ranges for each parameter to avoid correlation
  const shifted = (hash >>> (index * 5)) ^ (hash >>> (index * 3 + 7));
  return items[Math.abs(shifted) % items.length]!;
}

/**
 * Convert a seed into deterministic character parameters.
 * Same seed → same character, always.
 */
export function seedToParams(
  seed: string | number,
  evolutionTier: EvolutionTier = 'novice',
): CharacterParams {
  const hash = seedToNumber(seed);

  return {
    bodyId: pick(BODY_IDS, hash, 0),
    skinTone: pick(SKIN_TONES, hash, 1),
    hairColor: pick(HAIR_COLORS, hash, 2),
    outfitColor: pick(OUTFIT_COLORS, hash, 3),
    evolutionTier,
  };
}

/**
 * Verify seed determinism: same seed produces identical params.
 * Useful for debugging and testing.
 */
export function verifySeedDeterminism(seed: string | number): boolean {
  const a = seedToParams(seed);
  const b = seedToParams(seed);
  return (
    a.bodyId === b.bodyId &&
    a.skinTone.id === b.skinTone.id &&
    a.hairColor.id === b.hairColor.id &&
    a.outfitColor.id === b.outfitColor.id
  );
}

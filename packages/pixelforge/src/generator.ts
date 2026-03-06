// ═══════════════════════════════════════════
// CHARACTER GENERATOR — assemble characters from params
// Main entry point for character creation
// ═══════════════════════════════════════════

import type {
  BodyId,
  CharacterParams,
  CharacterMeta,
  GeneratedCharacter,
  EvolutionTier,
  Palette,
} from './types';
import { createPaletteV2 } from './palette';
import { seedToParams } from './seed';
import { applyEvolutionVisuals } from './evolution';

// ─── Character Metadata ───────────────────────────────────────

export const CHARACTER_META: Record<BodyId, CharacterMeta> = {
  aria:  { id: 'aria',  name: 'Aria',  desc: 'Light skin, blonde hair',   color: '#E8C35A', bodyType: 'slim' },
  kofi:  { id: 'kofi',  name: 'Kofi',  desc: 'Dark skin, flat-top fade',  color: '#2A9D8F', bodyType: 'athletic' },
  mei:   { id: 'mei',   name: 'Mei',   desc: 'Medium skin, bob w/ bangs', color: '#E879F9', bodyType: 'slim' },
  diego: { id: 'diego', name: 'Diego', desc: 'Tan skin, wavy brown hair', color: '#3B82F6', bodyType: 'sturdy' },
  zara:  { id: 'zara',  name: 'Zara',  desc: 'Dark skin, afro puffs',     color: '#FF6B8A', bodyType: 'sturdy' },
  alex:  { id: 'alex',  name: 'Alex',  desc: 'Non-binary, undercut',      color: '#4ECDC4', bodyType: 'athletic' },
  priya: { id: 'priya', name: 'Priya', desc: 'Brown skin, long braid',    color: '#FFD166', bodyType: 'petite' },
  liam:  { id: 'liam',  name: 'Liam',  desc: 'Light skin, messy auburn',  color: '#818CF8', bodyType: 'athletic' },
};

/**
 * Assemble a character from explicit parameters.
 * Uses the body's pre-authored art string + custom palette from params.
 *
 * Art strings are loaded from templates (Phase 3).
 * Until then, this returns characters with generated palettes
 * paired with the body's template art string.
 */
export function assembleCharacter(
  params: CharacterParams,
  /** Art string to use (from template registry) */
  artString: string,
): GeneratedCharacter {
  const palette = createPaletteV2(
    params.skinTone,
    params.hairColor,
    params.outfitColor,
  );

  // Apply evolution tier visuals
  const evolved = applyEvolutionVisuals(artString, palette, params.evolutionTier);

  const meta = CHARACTER_META[params.bodyId];

  return {
    artString: evolved.artString,
    palette: evolved.palette,
    meta,
    bodyId: params.bodyId,
    evolutionTier: params.evolutionTier,
  };
}

/**
 * Generate a character from a seed.
 * Deterministic: same seed → same character.
 */
export function generateCharacter(
  seed: string | number,
  artString: string,
  evolutionTier: EvolutionTier = 'novice',
): GeneratedCharacter {
  const params = seedToParams(seed, evolutionTier);
  return assembleCharacter(params, artString);
}

/**
 * Get all available body IDs.
 */
export function getBodyIds(): BodyId[] {
  return Object.keys(CHARACTER_META) as BodyId[];
}

/**
 * Get metadata for a specific body ID.
 */
export function getCharacterMeta(bodyId: BodyId): CharacterMeta {
  return CHARACTER_META[bodyId];
}

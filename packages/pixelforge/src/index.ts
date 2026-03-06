// ═══════════════════════════════════════════
// @plan2skill/pixelforge — Procedural Pixel Character Generator
//
// Framework-agnostic library for generating, compositing,
// and animating pixel art characters with equipment overlays.
//
// Pure TypeScript, zero dependencies, seed-deterministic.
// ═══════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────
export type {
  PixelGrid,
  Palette,
  PaletteRamp,
  BodyId,
  BodyType,
  EvolutionTier,
  ArtVersion,
  SkinTone,
  HairColor,
  OutfitColor,
  CharacterParams,
  CharacterMeta,
  GeneratedCharacter,
  EquipmentSlot,
  Rarity,
  EquipmentLayer,
  CompositeLayer,
} from './types';

export { DIGIT_ALIAS_NAMES } from './types';

// ─── Color Utilities ──────────────────────────────────────────
export { lighten, darken, shiftHue } from './color';

// ─── Palette ──────────────────────────────────────────────────
export {
  SKIN_TONES,
  HAIR_COLORS,
  OUTFIT_COLORS,
  createPaletteV1,
  createPaletteV2,
  darkenPalette,
  lightenPalette,
} from './palette';

// ─── Parser ───────────────────────────────────────────────────
export {
  parseArt,
  parseArtNamespaced,
  detectArtVersion,
  getAdjustedSize,
  normalizeArt,
  gridToArtString,
} from './parser';

// ─── Compositor ───────────────────────────────────────────────
export {
  EQUIPMENT_OFFSETS_V1,
  EQUIPMENT_OFFSETS_V2,
  getEquipmentOffsets,
  composite,
  compositeCharacterWithEquipment,
} from './compositor';

// ─── Animation ────────────────────────────────────────────────
export {
  IDLE_MS_PER_FRAME,
  buildIdleFrames,
  getBreathRow,
} from './animation';

// ─── Seed ─────────────────────────────────────────────────────
export { seedToParams, verifySeedDeterminism } from './seed';

// ─── Evolution ────────────────────────────────────────────────
export {
  EVOLUTION_THRESHOLDS,
  getEvolutionTier,
  applyEvolutionVisuals,
} from './evolution';

// ─── Generator ────────────────────────────────────────────────
export {
  CHARACTER_META,
  assembleCharacter,
  generateCharacter,
  getBodyIds,
  getCharacterMeta,
} from './generator';

// ─── Templates ────────────────────────────────────────────────
export {
  BODY_TEMPLATES_V1,
  DEFAULT_PALETTES_V1,
  BODY_TEMPLATES_V2,
  DEFAULT_PALETTES_V2,
  getPresetCharacter,
} from './templates/body';

export {
  buildEquipmentPalette,
  generateEquipmentSprite,
  getBaseShapes,
  getRarityColors,
} from './templates/equipment';

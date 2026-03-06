// ═══════════════════════════════════════════
// PIXELFORGE TYPES — all interfaces and type aliases
// Pure data types, zero dependencies
// ═══════════════════════════════════════════

/** 2D color grid — null = transparent pixel */
export type PixelGrid = (string | null)[][];

/** Single-char key → hex color mapping */
export type Palette = Record<string, string>;

/** 3-stop color ramp for shadow/highlight computation */
export interface PaletteRamp {
  base: string;
  highlight: string;
  shadow: string;
}

// ─── Character Parameters ─────────────────────────────────────

export type BodyId = 'aria' | 'kofi' | 'mei' | 'diego' | 'zara' | 'alex' | 'priya' | 'liam';
export type BodyType = 'slim' | 'athletic' | 'sturdy' | 'petite';
export type EvolutionTier = 'novice' | 'apprentice' | 'practitioner' | 'master';
export type ArtVersion = 'v1' | 'v2';

export interface SkinTone {
  id: string;
  color: string;
  blush: string;
  mouth: string;
}

export interface HairColor {
  id: string;
  H: string;  // main
  h: string;  // shadow
}

export interface OutfitColor {
  id: string;
  T: string;     // main
  t_dark: string; // shadow
}

export interface CharacterParams {
  bodyId: BodyId;
  skinTone: SkinTone;
  hairColor: HairColor;
  outfitColor: OutfitColor;
  evolutionTier: EvolutionTier;
}

export interface CharacterMeta {
  id: BodyId;
  name: string;
  desc: string;
  color: string;
  bodyType: BodyType;
}

export interface GeneratedCharacter {
  artString: string;
  palette: Palette;
  meta: CharacterMeta;
  bodyId: BodyId;
  evolutionTier: EvolutionTier;
}

// ─── Equipment ────────────────────────────────────────────────

export type EquipmentSlot = 'weapon' | 'shield' | 'armor' | 'helmet' | 'boots' | 'ring' | 'companion';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EquipmentLayer {
  artString: string;
  palette: Palette;
  slot: EquipmentSlot;
  rarityGlow?: string;
}

export interface CompositeLayer {
  data: PixelGrid;
  offsetX: number;
  offsetY: number;
}

// ─── Digit-Alias Palette System (v2) ──────────────────────────
// Art strings use single chars as palette keys.
// v2 (32x48) adds digit chars 0-9 as shadow/highlight aliases:
//
// '1' = Hh  (hair highlight)     '2' = Ss  (skin shadow)
// '3' = Sl  (skin highlight)     '4' = Ep  (eye pupil)
// '5' = Ew  (eye white)          '6' = Tt  (outfit shadow)
// '7' = Tl  (outfit highlight)   '8' = Pp  (pants shadow)
// '9' = Aa  (accent shadow)      '0' = Ff  (feet shadow)
// 'O' = outline
//
// v1 art strings contain NO digits — safe coexistence.

/** Semantic key names for digit aliases (documentation helper) */
export const DIGIT_ALIAS_NAMES: Record<string, string> = {
  '1': 'hair_highlight',
  '2': 'skin_shadow',
  '3': 'skin_highlight',
  '4': 'eye_pupil',
  '5': 'eye_white',
  '6': 'outfit_shadow',
  '7': 'outfit_highlight',
  '8': 'pants_shadow',
  '9': 'accent_shadow',
  '0': 'feet_shadow',
  O: 'outline',
};

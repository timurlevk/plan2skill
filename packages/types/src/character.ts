import type {
  ArchetypeId,
  AttributeKey,
  CharacterId,
  CompanionId,
  EquipmentSlot,
  EvolutionTier,
  Rarity,
} from './enums';

// ─── Character ───────────────────────────────────────────────────

export interface Character {
  id: string;
  userId: string;
  characterId: CharacterId;
  archetypeId: ArchetypeId;
  evolutionTier: EvolutionTier;
  companionId: CompanionId | null;
  attributes: CharacterAttributes;
  equipment: CharacterEquipment[];
  createdAt: string;
  updatedAt: string;
}

export type CharacterAttributes = Record<AttributeKey, number>;

// ─── Equipment ───────────────────────────────────────────────────

export interface CharacterEquipment {
  id: string;
  characterId: string;
  slot: EquipmentSlot;
  itemId: string;
  rarity: Rarity;
  equippedAt: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  attributeBonus: Partial<CharacterAttributes>;
  pixelArt: string; // Serialized pixel art grid
}

// ─── Archetype Definition ────────────────────────────────────────

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  description: string;
  icon: string;
  color: string;
  xpBonusType: string;
  xpBonusPercent: number;
}

// ─── Character Definition (Pixel Art) ────────────────────────────

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  description: string;
  ethnicity: string;
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  outfitColor: string;
  pixelArt: Record<EvolutionTier, string>; // Per-tier pixel art
}

// ─── Companion Definition ────────────────────────────────────────

export interface CompanionDefinition {
  id: CompanionId;
  name: string;
  buff: string;
  buffPercent: number;
  pixelArt: string;
}

// ─── Inputs ──────────────────────────────────────────────────────

export interface SelectArchetypeInput {
  archetypeId: ArchetypeId;
}

export interface SelectCharacterInput {
  characterId: CharacterId;
}

export interface SelectCompanionInput {
  companionId: CompanionId;
}

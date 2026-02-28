import { create } from 'zustand';
import type {
  ArchetypeId,
  CharacterId,
  CharacterAttributes,
  CharacterEquipment,
  CompanionId,
  EvolutionTier,
} from '@plan2skill/types';

interface CharacterState {
  id: string | null;
  characterId: CharacterId | null;
  archetypeId: ArchetypeId | null;
  evolutionTier: EvolutionTier;
  companionId: CompanionId | null;
  attributes: CharacterAttributes;
  equipment: CharacterEquipment[];

  setCharacter: (data: {
    id: string;
    characterId: CharacterId;
    archetypeId: ArchetypeId;
    evolutionTier: EvolutionTier;
    companionId: CompanionId | null;
    attributes: CharacterAttributes;
    equipment: CharacterEquipment[];
  }) => void;
  updateAttributes: (attrs: Partial<CharacterAttributes>) => void;
  setEvolutionTier: (tier: EvolutionTier) => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  id: null,
  characterId: null,
  archetypeId: null,
  evolutionTier: 'novice',
  companionId: null,
  attributes: { MAS: 10, INS: 10, INF: 10, RES: 10, VER: 10, DIS: 10 },
  equipment: [],

  setCharacter: (data) => set(data),
  updateAttributes: (attrs) =>
    set((s) => ({ attributes: { ...s.attributes, ...attrs } })),
  setEvolutionTier: (evolutionTier) => set({ evolutionTier }),
  reset: () =>
    set({
      id: null,
      characterId: null,
      archetypeId: null,
      evolutionTier: 'novice',
      companionId: null,
      attributes: { MAS: 10, INS: 10, INF: 10, RES: 10, VER: 10, DIS: 10 },
      equipment: [],
    }),
}));

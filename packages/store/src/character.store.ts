import { create } from 'zustand';
import type {
  ArchetypeId,
  CharacterId,
  CharacterAttributes,
  CharacterEquipment,
  CompanionId,
  EvolutionTier,
  InventoryItemFull,
  ComputedAttributes,
} from '@plan2skill/types';

const DEFAULT_ATTRIBUTES: CharacterAttributes = { STR: 10, INT: 10, CHA: 10, CON: 10, DEX: 10, WIS: 10 };
const DEFAULT_COMPUTED: ComputedAttributes = {
  base: { ...DEFAULT_ATTRIBUTES },
  bonus: { STR: 0, INT: 0, CHA: 0, CON: 0, DEX: 0, WIS: 0 },
  total: { ...DEFAULT_ATTRIBUTES },
};

interface CharacterState {
  id: string | null;
  characterId: CharacterId | null;
  archetypeId: ArchetypeId | null;
  evolutionTier: EvolutionTier;
  companionId: CompanionId | null;
  attributes: CharacterAttributes;
  equipment: CharacterEquipment[];

  // Phase 5F: inventory + computed attributes
  inventory: InventoryItemFull[];
  computedAttributes: ComputedAttributes;
  inventoryLoading: boolean;

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

  // Phase 5F actions
  setInventory: (items: InventoryItemFull[]) => void;
  addToInventory: (item: InventoryItemFull) => void;
  setEquipment: (equipment: CharacterEquipment[]) => void;
  setComputedAttributes: (attrs: ComputedAttributes) => void;
  setInventoryLoading: (loading: boolean) => void;

  reset: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  id: null,
  characterId: null,
  archetypeId: null,
  evolutionTier: 'novice',
  companionId: null,
  attributes: { ...DEFAULT_ATTRIBUTES },
  equipment: [],
  inventory: [],
  computedAttributes: { ...DEFAULT_COMPUTED },
  inventoryLoading: false,

  setCharacter: (data) => set(data),
  updateAttributes: (attrs) =>
    set((s) => ({ attributes: { ...s.attributes, ...attrs } })),
  setEvolutionTier: (evolutionTier) => set({ evolutionTier }),

  // Phase 5F actions
  setInventory: (inventory) => set({ inventory, inventoryLoading: false }),
  addToInventory: (item) =>
    set((s) => {
      const existing = s.inventory.findIndex((i) => i.itemId === item.itemId);
      if (existing >= 0) {
        const updated = [...s.inventory];
        updated[existing] = { ...updated[existing]!, quantity: updated[existing]!.quantity + 1 };
        return { inventory: updated };
      }
      return { inventory: [...s.inventory, item] };
    }),
  setEquipment: (equipment) => set({ equipment }),
  setComputedAttributes: (computedAttributes) => set({ computedAttributes }),
  setInventoryLoading: (inventoryLoading) => set({ inventoryLoading }),

  reset: () =>
    set({
      id: null,
      characterId: null,
      archetypeId: null,
      evolutionTier: 'novice',
      companionId: null,
      attributes: { ...DEFAULT_ATTRIBUTES },
      equipment: [],
      inventory: [],
      computedAttributes: { ...DEFAULT_COMPUTED },
      inventoryLoading: false,
    }),
}));

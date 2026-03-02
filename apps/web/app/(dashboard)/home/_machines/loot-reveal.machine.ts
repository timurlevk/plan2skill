import { setup, assign } from 'xstate';
import type { LootDrop } from '@plan2skill/types';

// ─── Loot Reveal Machine (§17) ──────────────────────────────
// States: hidden → teasing → revealing → revealed → claimed
// UX-R164: All macro animations interruptible via SKIP

export interface LootRevealContext {
  item: LootDrop | null;
  rarity: string;
}

type LootRevealEvent =
  | { type: 'TRIGGER'; item: LootDrop }
  | { type: 'SKIP' }
  | { type: 'CLAIM' }
  | { type: 'RESET' };

export const lootRevealMachine = setup({
  types: {
    context: {} as LootRevealContext,
    events: {} as LootRevealEvent,
  },
  actions: {
    setItem: assign({
      item: ({ event }) => (event as { type: 'TRIGGER'; item: LootDrop }).item,
      rarity: ({ event }) => (event as { type: 'TRIGGER'; item: LootDrop }).item.rarity,
    }),
    clearItem: assign({
      item: () => null,
      rarity: () => '',
    }),
  },
}).createMachine({
  id: 'lootReveal',
  initial: 'hidden',
  context: {
    item: null,
    rarity: '',
  },
  states: {
    hidden: {
      on: {
        TRIGGER: {
          target: 'teasing',
          actions: 'setItem',
        },
      },
    },
    teasing: {
      // Chest glow animation (Meso tier: 800ms)
      after: {
        800: 'revealing',
      },
      on: {
        SKIP: 'revealed',
      },
    },
    revealing: {
      // Card flip animation (Macro tier: 1500ms)
      after: {
        1500: 'revealed',
      },
      on: {
        SKIP: 'revealed',
      },
    },
    revealed: {
      on: {
        CLAIM: 'claimed',
      },
    },
    claimed: {
      type: 'final',
      on: {
        RESET: {
          target: 'hidden',
          actions: 'clearItem',
        },
      },
    },
  },
});

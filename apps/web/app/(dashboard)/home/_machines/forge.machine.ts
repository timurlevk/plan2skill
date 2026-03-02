import { setup, assign } from 'xstate';

// ─── Forge Machine (§17) ────────────────────────────────────
// States: idle → selecting → validating → forging → success | error
// Guards: canAddItem, hasThreeItems

export interface ForgeContext {
  inputItems: string[]; // max 3 itemIds
  inputRarity: string | null;
  outputItem: { itemId: string; name: string; rarity: string; slot: string; attributeBonus: Record<string, number> } | null;
  error: string | null;
}

type ForgeEvent =
  | { type: 'SELECT_ITEM' }
  | { type: 'ADD_ITEM'; itemId: string; rarity: string }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL' }
  | { type: 'VALID' }
  | { type: 'INVALID'; error: string }
  | { type: 'SUCCESS'; item: ForgeContext['outputItem'] }
  | { type: 'ERROR'; error: string }
  | { type: 'SKIP' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

export const forgeMachine = setup({
  types: {
    context: {} as ForgeContext,
    events: {} as ForgeEvent,
  },
  guards: {
    canAddItem: ({ context, event }) => {
      if (context.inputItems.length >= 3) return false;
      if (event.type !== 'ADD_ITEM') return false;
      // Must be same rarity as existing items
      if (context.inputRarity && event.rarity !== context.inputRarity) return false;
      return true;
    },
    hasThreeItems: ({ context }) => context.inputItems.length === 3,
  },
  actions: {
    addItem: assign({
      inputItems: ({ context, event }) => {
        if (event.type !== 'ADD_ITEM') return context.inputItems;
        return [...context.inputItems, event.itemId];
      },
      inputRarity: ({ context, event }) => {
        if (event.type !== 'ADD_ITEM') return context.inputRarity;
        return context.inputRarity ?? event.rarity;
      },
    }),
    removeItem: assign({
      inputItems: ({ context, event }) => {
        if (event.type !== 'REMOVE_ITEM') return context.inputItems;
        const idx = context.inputItems.indexOf(event.itemId);
        if (idx < 0) return context.inputItems;
        const next = [...context.inputItems];
        next.splice(idx, 1);
        return next;
      },
      inputRarity: ({ context, event }) => {
        if (event.type !== 'REMOVE_ITEM') return context.inputRarity;
        const remaining = context.inputItems.filter((id) => id !== event.itemId);
        return remaining.length > 0 ? context.inputRarity : null;
      },
    }),
    setError: assign({
      error: ({ event }) => (event.type === 'INVALID' || event.type === 'ERROR') ? event.error : null,
    }),
    setOutput: assign({
      outputItem: ({ event }) => (event.type === 'SUCCESS') ? event.item : null,
    }),
    clearAll: assign({
      inputItems: () => [] as string[],
      inputRarity: () => null,
      outputItem: () => null,
      error: () => null,
    }),
    clearError: assign({ error: () => null }),
  },
}).createMachine({
  id: 'forge',
  initial: 'idle',
  context: {
    inputItems: [],
    inputRarity: null,
    outputItem: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        SELECT_ITEM: 'selecting',
        ADD_ITEM: {
          target: 'selecting',
          guard: 'canAddItem',
          actions: 'addItem',
        },
      },
    },
    selecting: {
      on: {
        ADD_ITEM: {
          guard: 'canAddItem',
          actions: 'addItem',
        },
        REMOVE_ITEM: {
          actions: 'removeItem',
        },
        CONFIRM: {
          target: 'validating',
          guard: 'hasThreeItems',
        },
        CANCEL: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
    },
    validating: {
      on: {
        VALID: 'forging',
        INVALID: {
          target: 'selecting',
          actions: 'setError',
        },
      },
    },
    forging: {
      // Anvil animation (Macro tier: 2000ms)
      after: {
        2000: { target: 'success' },
      },
      on: {
        SUCCESS: {
          target: 'success',
          actions: 'setOutput',
        },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
        SKIP: 'success', // UX-R164: interruptible
      },
    },
    success: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'selecting',
          actions: 'clearError',
        },
        RESET: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
    },
  },
});

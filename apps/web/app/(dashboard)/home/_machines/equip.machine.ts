import { setup, assign } from 'xstate';

// ─── Equip Machine (§17) ────────────────────────────────────
// States: idle → confirming → equipping → equipped | error
// Optimistic UI pattern

export interface EquipContext {
  selectedItemId: string | null;
  targetSlot: string | null;
  error: string | null;
}

type EquipEvent =
  | { type: 'CONFIRM'; itemId: string; slot: string }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

export const equipMachine = setup({
  types: {
    context: {} as EquipContext,
    events: {} as EquipEvent,
  },
  actions: {
    setSelection: assign({
      selectedItemId: ({ event }) => (event.type === 'CONFIRM') ? event.itemId : null,
      targetSlot: ({ event }) => (event.type === 'CONFIRM') ? event.slot : null,
    }),
    setError: assign({
      error: ({ event }) => (event.type === 'ERROR') ? event.error : null,
    }),
    clearAll: assign({
      selectedItemId: () => null,
      targetSlot: () => null,
      error: () => null,
    }),
  },
}).createMachine({
  id: 'equip',
  initial: 'idle',
  context: {
    selectedItemId: null,
    targetSlot: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        CONFIRM: {
          target: 'confirming',
          actions: 'setSelection',
        },
      },
    },
    confirming: {
      on: {
        SUBMIT: 'equipping',
        RESET: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
    },
    equipping: {
      on: {
        SUCCESS: 'equipped',
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    equipped: {
      after: {
        1500: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
      on: {
        RESET: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
    },
    error: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'clearAll',
        },
      },
    },
  },
});

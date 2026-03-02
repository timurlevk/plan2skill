import { setup, assign } from 'xstate';

// ─── Shop Purchase Machine (§17) ────────────────────────────
// States: browsing → confirming → purchasing → success | insufficientFunds

export interface ShopPurchaseContext {
  selectedItemId: string | null;
  selectedItemName: string | null;
  selectedItemCost: number;
  currentCoins: number;
  error: string | null;
}

type ShopPurchaseEvent =
  | { type: 'SELECT'; itemId: string; name: string; cost: number; coins: number }
  | { type: 'CONFIRM' }
  | { type: 'SUCCESS' }
  | { type: 'INSUFFICIENT'; error: string }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

export const shopPurchaseMachine = setup({
  types: {
    context: {} as ShopPurchaseContext,
    events: {} as ShopPurchaseEvent,
  },
  actions: {
    setSelection: assign({
      selectedItemId: ({ event }) => (event.type === 'SELECT') ? event.itemId : null,
      selectedItemName: ({ event }) => (event.type === 'SELECT') ? event.name : null,
      selectedItemCost: ({ event }) => (event.type === 'SELECT') ? event.cost : 0,
      currentCoins: ({ event }) => (event.type === 'SELECT') ? event.coins : 0,
    }),
    setError: assign({
      error: ({ event }) => ('error' in event) ? (event as { error: string }).error : null,
    }),
    clearAll: assign({
      selectedItemId: () => null,
      selectedItemName: () => null,
      selectedItemCost: () => 0,
      currentCoins: () => 0,
      error: () => null,
    }),
  },
}).createMachine({
  id: 'shopPurchase',
  initial: 'browsing',
  context: {
    selectedItemId: null,
    selectedItemName: null,
    selectedItemCost: 0,
    currentCoins: 0,
    error: null,
  },
  states: {
    browsing: {
      on: {
        SELECT: {
          target: 'confirming',
          actions: 'setSelection',
        },
      },
    },
    confirming: {
      on: {
        CONFIRM: 'purchasing',
        RESET: {
          target: 'browsing',
          actions: 'clearAll',
        },
      },
    },
    purchasing: {
      on: {
        SUCCESS: 'success',
        INSUFFICIENT: {
          target: 'insufficientFunds',
          actions: 'setError',
        },
        ERROR: {
          target: 'browsing',
          actions: 'setError',
        },
      },
    },
    success: {
      after: {
        2000: {
          target: 'browsing',
          actions: 'clearAll',
        },
      },
      on: {
        RESET: {
          target: 'browsing',
          actions: 'clearAll',
        },
      },
    },
    insufficientFunds: {
      on: {
        RESET: {
          target: 'browsing',
          actions: 'clearAll',
        },
      },
    },
  },
});

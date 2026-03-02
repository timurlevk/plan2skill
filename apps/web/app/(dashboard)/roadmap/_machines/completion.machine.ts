import { setup, assign } from 'xstate';
import type { WhatsNextOption, RoadmapCompletionStats } from '@plan2skill/types';

// ─── Completion Machine (BL-008) ────────────────────────────
// States: idle → celebrating → trophyClaim → whatsNext → [sub-states] → done
// UX-R164: All macro animations interruptible via SKIP
// Follows XState v5 pattern from _machines/loot-reveal.machine.ts

export interface CompletionContext {
  roadmapId: string | null;
  stats: RoadmapCompletionStats | null;
  selectedOption: WhatsNextOption | null;
  aiRegenerationsLeft: number;
}

export type CompletionEvent =
  | { type: 'ROADMAP_COMPLETE'; roadmapId: string }
  | { type: 'SKIP' }
  | { type: 'STATS_LOADED'; stats: RoadmapCompletionStats }
  | { type: 'CLAIM_TROPHY' }
  | { type: 'SELECT_OPTION'; option: WhatsNextOption }
  | { type: 'REGENERATE' }
  | { type: 'CONFIRM' }
  | { type: 'BACK' }
  | { type: 'DONE' }
  | { type: 'RESET' };

export const completionMachine = setup({
  types: {
    context: {} as CompletionContext,
    events: {} as CompletionEvent,
  },
  guards: {
    canRegenerate: ({ context }) => context.aiRegenerationsLeft > 0,
  },
  actions: {
    setRoadmapId: assign({
      roadmapId: ({ event }) =>
        event.type === 'ROADMAP_COMPLETE' ? event.roadmapId : null,
    }),
    setStats: assign({
      stats: ({ event }) =>
        event.type === 'STATS_LOADED' ? event.stats : null,
    }),
    setOption: assign({
      selectedOption: ({ event }) =>
        event.type === 'SELECT_OPTION' ? event.option : null,
    }),
    decrementRegenerations: assign({
      aiRegenerationsLeft: ({ context }) =>
        Math.max(0, context.aiRegenerationsLeft - 1),
    }),
    clearOption: assign({
      selectedOption: () => null,
    }),
    resetAll: assign({
      roadmapId: () => null,
      stats: () => null,
      selectedOption: () => null,
      aiRegenerationsLeft: () => 3,
    }),
  },
}).createMachine({
  id: 'completion',
  initial: 'idle',
  context: {
    roadmapId: null,
    stats: null,
    selectedOption: null,
    aiRegenerationsLeft: 3,
  },
  states: {
    idle: {
      on: {
        ROADMAP_COMPLETE: {
          target: 'celebrating',
          actions: 'setRoadmapId',
        },
      },
    },

    // Macro tier: 2500ms celebration overlay (interruptible)
    celebrating: {
      on: {
        SKIP: 'trophyClaim',
        STATS_LOADED: { actions: 'setStats' },
      },
      after: {
        2500: 'trophyClaim',
      },
    },

    // Trophy claim transition (Meso tier: 800ms)
    trophyClaim: {
      on: {
        CLAIM_TROPHY: 'whatsNext',
        STATS_LOADED: { actions: 'setStats' },
      },
    },

    // What's Next — 5 option cards
    whatsNext: {
      on: {
        SELECT_OPTION: {
          target: 'optionSelected',
          actions: 'setOption',
        },
      },
    },

    // Option selected — confirmation before proceeding
    optionSelected: {
      on: {
        CONFIRM: 'done',
        REGENERATE: {
          target: 'whatsNext',
          guard: 'canRegenerate',
          actions: ['decrementRegenerations', 'clearOption'],
        },
        BACK: {
          target: 'whatsNext',
          actions: 'clearOption',
        },
      },
    },

    done: {
      type: 'final',
      on: {
        RESET: {
          target: 'idle',
          actions: 'resetAll',
        },
      },
    },
  },
});

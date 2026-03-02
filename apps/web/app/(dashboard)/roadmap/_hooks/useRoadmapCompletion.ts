'use client';

import { useMemo, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { trpc } from '@plan2skill/api-client';
import { completionMachine } from '../_machines/completion.machine';

// ═══════════════════════════════════════════
// ROADMAP COMPLETION HOOK — BL-008
// Wires XState completion machine to tRPC calls
// ═══════════════════════════════════════════

export function useRoadmapCompletion() {
  const [state, send] = useMachine(completionMachine);

  const roadmapId = state.context.roadmapId;
  const isCelebrating = state.matches('celebrating') || state.matches('trophyClaim');
  const isWhatsNext = state.matches('whatsNext') || state.matches('optionSelected');

  // Fetch completion stats when celebrating
  const { data: stats } = trpc.roadmap.completionStats.useQuery(
    { roadmapId: roadmapId! },
    {
      enabled: !!roadmapId && isCelebrating && !state.context.stats,
      staleTime: Infinity,
    },
  );

  // Fetch trending domains when showing What's Next
  const { data: trending } = trpc.roadmap.trending.useQuery(undefined, {
    enabled: isWhatsNext,
    staleTime: 1000 * 60 * 10, // 10min
  });

  // Fetch overdue reviews for adaptive card ordering
  const { data: dueReviews } = trpc.review.due.useQuery(
    { limit: 1 },
    {
      enabled: isWhatsNext,
      staleTime: 1000 * 60 * 5,
    },
  );

  // Hydrate stats into machine context when they arrive
  useEffect(() => {
    if (stats && isCelebrating) {
      send({ type: 'STATS_LOADED', stats: stats as any });
    }
  }, [stats, isCelebrating, send]);

  const overdueReviewCount = dueReviews ? (Array.isArray(dueReviews) ? dueReviews.length : 0) : 0;

  return {
    state,
    send,
    stats: state.context.stats ?? (stats as any) ?? null,
    trending: trending ?? [],
    overdueReviewCount,
    isCelebrating,
    isWhatsNext,
    isDone: state.matches('done'),
    isIdle: state.matches('idle'),
  };
}

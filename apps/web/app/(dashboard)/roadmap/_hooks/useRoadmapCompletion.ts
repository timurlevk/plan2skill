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
  const { data: stats, isError: statsError } = trpc.roadmap.completionStats.useQuery(
    { roadmapId: roadmapId! },
    {
      enabled: !!roadmapId && isCelebrating && !state.context.stats,
      staleTime: Infinity,
    },
  );

  // Fetch trending domains when showing What's Next
  const { data: trending, isError: trendingError } = trpc.roadmap.trending.useQuery(undefined, {
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

  // prefers-reduced-motion: skip celebration animation immediately (Крок 9 / MICRO_ANIMATION_GUIDELINES §10)
  useEffect(() => {
    if (!isCelebrating) return;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && state.matches('celebrating')) {
      send({ type: 'SKIP' });
    }
  }, [isCelebrating, state, send]);

  // Hydrate stats into machine context when they arrive
  useEffect(() => {
    if (stats && isCelebrating) {
      send({ type: 'STATS_LOADED', stats: stats as any });
    }
  }, [stats, isCelebrating, send]);

  // Phase W5: Unblock machine if stats query fails — send fallback stats
  useEffect(() => {
    if (statsError && isCelebrating && !state.context.stats) {
      send({ type: 'STATS_LOADED', stats: { totalTasks: 0, daysSpent: 0, xpEarned: 0 } as any });
      console.warn('[RoadmapCompletion] Stats query failed, using fallback');
    }
  }, [statsError, isCelebrating, state.context.stats, send]);

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
    statsError,
    trendingError,
  };
}

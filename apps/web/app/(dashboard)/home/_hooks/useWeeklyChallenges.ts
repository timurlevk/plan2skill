import { useMemo } from 'react';
import { useAuthStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';

// ─── Weekly Challenges Hook (Phase 5E) ──────────────────────────
// Fetches current week's challenges from server.

// Canonical difficulty order: easy → medium → hard (Ⅰ → Ⅱ → Ⅲ)
// Server sorts alphabetically (easy → hard → medium) — fix client-side.
const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

export function useWeeklyChallenges() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError } = trpc.achievement.weeklyChallenges.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 3,
  });

  const challenges = useMemo(
    () => [...(data?.challenges ?? [])].sort(
      (a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.difficulty] ?? 9),
    ),
    [data?.challenges],
  );

  return {
    challenges,
    weekEnd: data?.weekEnd ?? '',
    allCompleted: data?.allCompleted ?? false,
    bonusClaimed: data?.bonusClaimed ?? false,
    isLoading,
    isError,
  };
}

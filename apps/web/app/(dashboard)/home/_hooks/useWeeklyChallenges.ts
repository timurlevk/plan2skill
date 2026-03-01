import { useAuthStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';

// ─── Weekly Challenges Hook (Phase 5E) ──────────────────────────
// Fetches current week's challenges from server.

export function useWeeklyChallenges() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = trpc.achievement.weeklyChallenges.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 3,
  });

  return {
    challenges: data?.challenges ?? [],
    weekEnd: data?.weekEnd ?? '',
    allCompleted: data?.allCompleted ?? false,
    isLoading,
  };
}

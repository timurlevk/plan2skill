import { useEffect, useRef } from 'react';
import { useAuthStore, useProgressionStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';

/**
 * Server hydration hook — syncs progression state from server on initial load.
 * Only runs when authenticated. Falls back to localStorage state if server unavailable.
 */
export function useServerHydration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydratedRef = useRef(false);

  // @ts-expect-error — AppRouter type resolution pending project references setup
  const { data: profile, isLoading } = trpc.progression.getProfile.useQuery(undefined, {
    enabled: isAuthenticated && !hydratedRef.current,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });

  useEffect(() => {
    if (!profile || hydratedRef.current) return;
    hydratedRef.current = true;

    // Merge server data into local store (server is source of truth for XP/level/streak)
    const store = useProgressionStore.getState();

    // Only update if server has data (non-zero XP or different level)
    if (profile.totalXp > 0 || profile.level > 1) {
      useProgressionStore.setState({
        totalXp: profile.totalXp,
        level: profile.level,
        coins: profile.coins,
        energyCrystals: profile.energyCrystals,
        maxEnergyCrystals: profile.maxEnergyCrystals,
        currentStreak: profile.streak?.currentStreak ?? store.currentStreak,
        longestStreak: profile.streak?.longestStreak ?? store.longestStreak,
        lastActivityDate: profile.streak?.lastActivityDate ?? store.lastActivityDate,
      });
    }
  }, [profile]);

  return { isHydrating: isAuthenticated && isLoading, isAuthenticated };
}

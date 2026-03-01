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


  const { data: profile, isLoading } = trpc.progression.getProfile.useQuery(undefined, {
    enabled: isAuthenticated && !hydratedRef.current,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });


  const { data: mastery } = trpc.review.mastery.useQuery(undefined, {
    enabled: isAuthenticated && !hydratedRef.current,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });


  const { data: serverAchievements } = trpc.achievement.list.useQuery(undefined, {
    enabled: isAuthenticated && !hydratedRef.current,
    staleTime: 1000 * 60 * 5,
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

    // Hydrate mastery stats (Phase 5D)
    if (mastery) {
      useProgressionStore.setState({
        masteredSkills: mastery.masteredCount ?? 0,
        totalReviews: mastery.skills?.reduce(
          (sum: number, s: { totalReviews: number }) => sum + s.totalReviews, 0,
        ) ?? 0,
      });
    }

    // Hydrate server-side achievements (Phase 5E)
    if (serverAchievements && Array.isArray(serverAchievements)) {
      const serverIds = serverAchievements.map(
        (a: { achievementId: string }) => a.achievementId,
      );
      const merged = [...new Set([...store.unlockedAchievements, ...serverIds])];
      if (merged.length > store.unlockedAchievements.length) {
        useProgressionStore.setState({ unlockedAchievements: merged });
      }
    }
  }, [profile, mastery, serverAchievements]);

  return { isHydrating: isAuthenticated && isLoading, isAuthenticated };
}

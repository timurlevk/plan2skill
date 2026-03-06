import { useEffect, useRef } from 'react';
import { useAuthStore, useProgressionStore, useCharacterStore, useRoadmapStore, useSkillStore, useSocialStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import type { SubscriptionTier } from '@plan2skill/types';

/**
 * Server hydration hook — syncs progression state from server on initial load.
 * Only runs when authenticated. Falls back to localStorage state if server unavailable.
 */
export function useServerHydration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydratedRef = useRef(false);


  const queryOpts = {
    enabled: isAuthenticated && !hydratedRef.current,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  } as const;

  const { data: profile, isLoading, isError: profileError } = trpc.progression.getProfile.useQuery(undefined, queryOpts);
  const { data: mastery, isError: masteryError } = trpc.review.mastery.useQuery(undefined, queryOpts);
  const { data: serverAchievements, isError: achievementsError } = trpc.achievement.list.useQuery(undefined, queryOpts);

  // Phase 5F: equipment inventory + computed attributes
  const { data: inventory, isError: inventoryError } = trpc.equipment.inventory.useQuery(undefined, queryOpts);
  const { data: computedAttributes, isError: attributesError } = trpc.equipment.attributes.useQuery(undefined, queryOpts);

  // BL-007: Roadmap list hydration
  const { data: roadmaps, isError: roadmapsError } = trpc.roadmap.list.useQuery(undefined, queryOpts);

  // Character identity hydration
  const { data: character, isError: characterError } = trpc.character.get.useQuery(undefined, queryOpts);

  // Phase W2: Skill Elo ratings hydration
  const { data: skillElos, isError: skillElosError } = trpc.skillElo.list.useQuery(undefined, queryOpts);

  // Phase W4: Equipped items hydration (dedicated endpoint, not just character.equipment join)
  const { data: equippedItems, isError: equippedError } = trpc.equipment.equipped.useQuery(undefined, queryOpts);

  // User profile (displayName for social features)
  const { data: userProfile, isError: userProfileError } = trpc.user.profile.useQuery(undefined, queryOpts);

  // Phase S: Social data hydration (Guild Arena)
  const { data: leagueData, isError: leagueError } = trpc.social.myLeague.useQuery(undefined, queryOpts);
  const { data: socialFriends, isError: friendsError } = trpc.social.getFriends.useQuery(undefined, queryOpts);
  const { data: activePartyQuest, isError: partyQuestError } = trpc.social.activePartyQuest.useQuery(undefined, queryOpts);

  // Aggregate errors across all queries
  const hasAnyError = profileError || masteryError || achievementsError || inventoryError
    || attributesError || roadmapsError || characterError || skillElosError || equippedError
    || userProfileError || leagueError || friendsError || partyQuestError;

  const erroredQueries: string[] = [];
  if (profileError) erroredQueries.push('profile');
  if (masteryError) erroredQueries.push('mastery');
  if (achievementsError) erroredQueries.push('achievements');
  if (inventoryError) erroredQueries.push('inventory');
  if (attributesError) erroredQueries.push('attributes');
  if (roadmapsError) erroredQueries.push('roadmaps');
  if (characterError) erroredQueries.push('character');
  if (skillElosError) erroredQueries.push('skillElos');
  if (equippedError) erroredQueries.push('equipped');
  if (userProfileError) erroredQueries.push('userProfile');
  if (leagueError) erroredQueries.push('league');
  if (friendsError) erroredQueries.push('friends');
  if (partyQuestError) erroredQueries.push('partyQuest');

  useEffect(() => {
    if (!profile || hydratedRef.current) return;
    hydratedRef.current = true;

    // Merge server data into local store (server is source of truth for XP/level/streak)
    const store = useProgressionStore.getState();

    // Always sync server → store (server is source of truth)
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

    // Hydrate subscription tier
    if (profile.subscriptionTier) {
      useProgressionStore.setState({
        subscriptionTier: profile.subscriptionTier as SubscriptionTier,
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

    // Hydrate equipment inventory + computed attributes (Phase 5F)
    if (inventory) {
      useCharacterStore.getState().setInventory(inventory as any);
    }
    if (computedAttributes) {
      useCharacterStore.getState().setComputedAttributes(computedAttributes as any);
    }

    // Phase W4: Hydrate equipped items (dedicated endpoint)
    if (equippedItems && Array.isArray(equippedItems)) {
      useCharacterStore.getState().setEquipment(equippedItems as any);
    }

    // BL-007: Hydrate roadmap store
    if (roadmaps && Array.isArray(roadmaps)) {
      useRoadmapStore.getState().setRoadmaps(roadmaps as any);
      const active = (roadmaps as any[]).find((r: any) => r.status === 'active');
      useRoadmapStore.getState().setActiveRoadmap(active ?? null);
    }

    // Phase W2: Hydrate skill Elo ratings
    if (skillElos && Array.isArray(skillElos)) {
      useSkillStore.getState().setSkillElos(skillElos);
    }

    // Hydrate character identity
    if (character) {
      useCharacterStore.getState().setCharacter({
        id: character.id,
        characterId: character.characterId as any,
        archetypeId: character.archetypeId as any,
        evolutionTier: character.evolutionTier as any,
        companionId: character.companionId as any,
        attributes: character.attributes as any,
        equipment: character.equipment as any,
      });
    }

    // Phase S: Hydrate social data (Guild Arena)
    if (userProfile?.displayName) {
      useSocialStore.getState().setDisplayName(userProfile.displayName);
    }
    if (leagueData) {
      useSocialStore.getState().setLeagueData(leagueData as any);
    }
    if (socialFriends && Array.isArray(socialFriends)) {
      useSocialStore.getState().setFriends(socialFriends as any);
    }
    if (activePartyQuest !== undefined) {
      useSocialStore.getState().setPartyQuest(activePartyQuest as any);
    }
  }, [profile, mastery, serverAchievements, inventory, computedAttributes, roadmaps, character, skillElos, equippedItems, userProfile, leagueData, socialFriends, activePartyQuest]);

  return {
    isHydrating: isAuthenticated && isLoading,
    isAuthenticated,
    isHydrationError: !!hasAnyError,
    erroredQueries,
  };
}

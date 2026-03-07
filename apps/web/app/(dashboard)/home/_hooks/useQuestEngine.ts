import { useState, useCallback, useEffect, useRef } from 'react';
import { useProgressionStore, useAuthStore, useCharacterStore, useRoadmapStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { rollBonusXP } from '../_utils/xp-utils';
import type { BonusResult } from '../_utils/xp-utils';
import { playCompleteSound } from './useSound';
import { ACHIEVEMENTS, type Achievement } from '../_data/achievements';
import type { LootDrop } from '@plan2skill/types';

// ─── Quest Engine — persistence pipeline ─────────────────────────
// Manages quest completion flow with progressionStore integration.
// Optimistic UI: local store updates instantly, tRPC syncs to server in background.
// Handles XP, bonus rolls, streaks, achievements, loot drops, sound, and animations.

// Phase 5H: attribute growth result from milestone completion
export interface AttributeGrowthResult {
  attribute: string;
  amount: number;
}

export interface QuestEngineResult {
  completedQuests: Set<string>;
  bonusResults: Map<string, BonusResult>;
  xpFloatId: string | null;
  xpFloatAmount: number;
  newlyUnlockedAchievements: Achievement[];
  lastLootDrop: LootDrop | null;
  lastAttributeGrowth: AttributeGrowthResult[] | null;
  dismissAchievement: () => void;
  dismissLootDrop: () => void;
  dismissAttributeGrowth: () => void;
  completeQuest: (taskId: string, goalId: string, xp: number) => void;
  undoQuest: (taskId: string, xp: number) => void;
}

export function useQuestEngine(): QuestEngineResult {
  const store = useProgressionStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  // tRPC mutations for server-side sync (background, non-blocking)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const utils = trpc.useUtils();
  const completeTaskMutation = trpc.progression.completeTask.useMutation();

  const unlockAchievementMutation = trpc.achievement.unlock.useMutation();

  // Phase W1: review.create for spaced repetition after quest completion
  const createReviewMutation = trpc.review.create.useMutation();

  // Initialize from persisted daily quests
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(
    () => new Set(store.dailyQuestsCompleted)
  );

  // Ephemeral per session — bonus roll results for UI display
  const [bonusResults, setBonusResults] = useState<Map<string, BonusResult>>(new Map());

  // XP float animation state
  const [xpFloatId, setXpFloatId] = useState<string | null>(null);
  const [xpFloatAmount, setXpFloatAmount] = useState(0);

  // Achievement toast queue
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);

  // Phase 5F: loot drop from server
  const [lastLootDrop, setLastLootDrop] = useState<LootDrop | null>(null);

  // Phase 5H: attribute growth from milestone completion
  const [lastAttributeGrowth, setLastAttributeGrowth] = useState<AttributeGrowthResult[] | null>(null);

  // Check and reset daily on mount
  useEffect(() => {
    store.checkAndResetDaily();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync completed quests from store on hydration
  useEffect(() => {
    setCompletedQuests(new Set(store.dailyQuestsCompleted));
  }, [store.dailyQuestsCompleted]);

  const checkAchievements = useCallback(() => {
    const s = storeRef.current;
    const checkState: import('../_data/achievements').AchievementCheckState = {
      questHistory: s.questHistory,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      level: s.level,
      totalXp: s.totalXp,
      coins: s.coins,
      unlockedAchievements: s.unlockedAchievements,
      masteredSkills: s.masteredSkills,
      totalReviews: s.totalReviews,
      energyCrystals: s.energyCrystals,
      dailyQuestsCompleted: s.dailyQuestsCompleted,
    };
    const newUnlocks: Achievement[] = [];
    for (const achievement of ACHIEVEMENTS) {
      if (s.unlockedAchievements.includes(achievement.id)) continue;
      if (achievement.check(checkState)) {
        s.unlockAchievement(achievement.id);
        newUnlocks.push(achievement);

        // Sync to server (background, non-blocking)
        if (isAuthenticated) {
          unlockAchievementMutation.mutate(
            { achievementId: achievement.id, xpReward: achievement.xpReward },
            { onError: (err: { message: string }) => {
              console.warn('[QuestEngine] Achievement sync failed:', err.message);
            }},
          );
        }
      }
    }
    if (newUnlocks.length > 0) {
      setNewlyUnlockedAchievements(prev => [...prev, ...newUnlocks]);
    }
  }, [isAuthenticated, unlockAchievementMutation]);

  const completeQuest = useCallback((taskId: string, goalId: string, xp: number) => {
    const s = storeRef.current;

    // 1. Roll bonus XP (Variable Ratio Reinforcement)
    const bonus = rollBonusXP(xp);
    setBonusResults(prev => {
      const next = new Map(prev);
      next.set(taskId, bonus);
      return next;
    });

    // 2. Complete quest in progression store (persisted)
    const result = s.completeQuest(taskId, goalId, xp, bonus.bonus);

    // 3. Update local set
    setCompletedQuests(prev => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    // 4. Update streak
    s.updateStreak();

    // 5. Sound (Micro tier)
    playCompleteSound();

    // 6. XP float animation
    setXpFloatId(taskId);
    setXpFloatAmount(bonus.total);
    setTimeout(() => setXpFloatId(null), 1200);

    // 7. Trigger XP animation in store
    s.triggerXpAnimation(bonus.total);
    setTimeout(() => storeRef.current.clearXpAnimation(), 1500);

    // 8. Level up celebration
    if (result.leveledUp) {
      s.triggerLevelUp();
      setTimeout(() => storeRef.current.clearLevelUp(), 3000);
    }

    // 9. Check achievements
    setTimeout(() => checkAchievements(), 200);

    // 10. Sync to server (background, non-blocking)
    if (isAuthenticated) {
      completeTaskMutation.mutate(
        { taskId, validationResult: {}, timeSpentSeconds: undefined },
        {
          onSuccess: (data: { lootDrop?: LootDrop | null; attributeGrowth?: AttributeGrowthResult[] | null; evolutionTierChange?: string | null }) => {
            // Phase 5H: handle attribute growth from milestone completion
            if (data?.attributeGrowth && data.attributeGrowth.length > 0) {
              setLastAttributeGrowth(data.attributeGrowth);
            }
            // Phase 5F: handle loot drop from server response
            if (data?.lootDrop) {
              setLastLootDrop(data.lootDrop);
              // Add to inventory in character store
              useCharacterStore.getState().addToInventory({
                id: '',
                itemId: data.lootDrop.itemId,
                slot: data.lootDrop.slot,
                rarity: data.lootDrop.rarity as any,
                quantity: 1,
                acquiredAt: new Date().toISOString(),
                name: data.lootDrop.name,
                description: data.lootDrop.description,
                attributeBonus: data.lootDrop.attributeBonus,
              });
            }

            // Phase W1: create spaced repetition review item for skill tracking
            // Uses goalId as skillId — the goalId param carries the skill domain
            if (goalId) {
              createReviewMutation.mutate(
                { skillId: goalId, skillDomain: goalId },
                { onError: (e: { message: string }) =>
                  console.warn('[QuestEngine] review.create failed:', e.message),
                },
              );
            }

            // Refresh roadmap store so Quest Lines widget updates
            (utils.roadmap.list.fetch() as Promise<unknown>).then((fresh) => {
              if (fresh && Array.isArray(fresh)) {
                useRoadmapStore.getState().setRoadmaps(fresh as any);
                const active = (fresh as any[]).find((r: any) => r.status === 'active');
                useRoadmapStore.getState().setActiveRoadmap(active ?? null);
              }
            }).catch((err) => console.warn('[QuestEngine] roadmap refresh failed:', err));
          },
          onError: (err: { message: string }) => {
            // Server sync failed — local state is still valid
            console.warn('[QuestEngine] Server sync failed:', err.message);
          },
        },
      );
    }
  }, [checkAchievements, isAuthenticated, completeTaskMutation, createReviewMutation]);

  const undoQuest = useCallback((taskId: string, xp: number) => {
    const s = storeRef.current;
    const bonus = bonusResults.get(taskId);
    const totalXpToRemove = bonus ? bonus.total : xp;

    s.undoQuestCompletion(taskId, totalXpToRemove);

    setCompletedQuests(prev => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });

    setBonusResults(prev => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, [bonusResults]);

  const dismissAchievement = useCallback(() => {
    setNewlyUnlockedAchievements(prev => prev.slice(1));
  }, []);

  const dismissLootDrop = useCallback(() => {
    setLastLootDrop(null);
  }, []);

  const dismissAttributeGrowth = useCallback(() => {
    setLastAttributeGrowth(null);
  }, []);

  return {
    completedQuests,
    bonusResults,
    xpFloatId,
    xpFloatAmount,
    newlyUnlockedAchievements,
    lastLootDrop,
    lastAttributeGrowth,
    dismissAchievement,
    dismissLootDrop,
    dismissAttributeGrowth,
    completeQuest,
    undoQuest,
  };
}

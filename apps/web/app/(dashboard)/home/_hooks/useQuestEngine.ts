import { useState, useCallback, useEffect, useRef } from 'react';
import { useProgressionStore, useAuthStore } from '@plan2skill/store';
import { trpc } from '@plan2skill/api-client';
import { rollBonusXP } from '../_utils/xp-utils';
import type { BonusResult } from '../_utils/xp-utils';
import { playCompleteSound } from './useSound';
import { ACHIEVEMENTS, type Achievement } from '../_data/achievements';

// ─── Quest Engine — persistence pipeline ─────────────────────────
// Manages quest completion flow with progressionStore integration.
// Optimistic UI: local store updates instantly, tRPC syncs to server in background.
// Handles XP, bonus rolls, streaks, achievements, sound, and animations.

export interface QuestEngineResult {
  completedQuests: Set<string>;
  bonusResults: Map<string, BonusResult>;
  xpFloatId: string | null;
  xpFloatAmount: number;
  newlyUnlockedAchievements: Achievement[];
  dismissAchievement: () => void;
  completeQuest: (taskId: string, goalId: string, xp: number) => void;
  undoQuest: (taskId: string, xp: number) => void;
}

export function useQuestEngine(): QuestEngineResult {
  const store = useProgressionStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  // tRPC mutations for server-side sync (background, non-blocking)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // @ts-expect-error — AppRouter type resolution pending project references setup
  const completeTaskMutation = trpc.progression.completeTask.useMutation();
  // @ts-expect-error — AppRouter type resolution pending project references setup
  const unlockAchievementMutation = trpc.achievement.unlock.useMutation();

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
          onError: (err: { message: string }) => {
            // Server sync failed — local state is still valid
            console.warn('[QuestEngine] Server sync failed:', err.message);
          },
        },
      );
    }
  }, [checkAchievements, isAuthenticated, completeTaskMutation]);

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

  return {
    completedQuests,
    bonusResults,
    xpFloatId,
    xpFloatAmount,
    newlyUnlockedAchievements,
    dismissAchievement,
    completeQuest,
    undoQuest,
  };
}

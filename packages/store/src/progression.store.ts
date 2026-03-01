import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskCompletionResult } from '@plan2skill/types';
import { computeLevel, getLevelInfo } from './level-utils';

// ─── Quest Completion Record ─────────────────────────────────────

export interface QuestCompletion {
  questId: string;
  goalId: string;
  baseXp: number;
  bonusXp: number;
  completedAt: string; // ISO
}

// ─── Progression State ───────────────────────────────────────────

interface ProgressionState {
  // Core
  totalXp: number;
  level: number;
  coins: number;
  energyCrystals: number;
  maxEnergyCrystals: number;
  currentStreak: number;
  longestStreak: number;

  // Streak tracking
  lastActivityDate: string | null; // ISO date (YYYY-MM-DD)
  streakFreezeUsedThisWeek: boolean;

  // Daily tracking
  dailyQuestsCompleted: string[]; // quest IDs completed today
  dailyDate: string | null; // YYYY-MM-DD — detect new day

  // History (capped at 500)
  questHistory: QuestCompletion[];

  // Achievements
  unlockedAchievements: string[];

  // UX toggles
  quietMode: boolean;

  // Animation state (transient — not persisted)
  xpAnimation: { amount: number; active: boolean };
  levelUpAnimation: boolean;

  // ─── Actions ───

  completeQuest: (
    questId: string,
    goalId: string,
    baseXp: number,
    bonusXp: number,
  ) => TaskCompletionResult;

  undoQuestCompletion: (questId: string, xpToRemove: number) => void;
  checkAndResetDaily: () => void;
  updateStreak: () => void;
  unlockAchievement: (id: string) => void;
  toggleQuietMode: () => void;

  // Crystals
  consumeCrystal: () => void;
  rechargeCrystals: () => void;

  // Animation helpers
  triggerXpAnimation: (amount: number) => void;
  clearXpAnimation: () => void;
  triggerLevelUp: () => void;
  clearLevelUp: () => void;

  reset: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Initial state ───────────────────────────────────────────────

const initialState = {
  totalXp: 0,
  level: 1,
  coins: 0,
  energyCrystals: 3,
  maxEnergyCrystals: 3,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null as string | null,
  streakFreezeUsedThisWeek: false,
  dailyQuestsCompleted: [] as string[],
  dailyDate: null as string | null,
  questHistory: [] as QuestCompletion[],
  unlockedAchievements: [] as string[],
  quietMode: false,
  xpAnimation: { amount: 0, active: false },
  levelUpAnimation: false,
};

// ─── Store ───────────────────────────────────────────────────────

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeQuest: (questId, goalId, baseXp, bonusXp) => {
        const s = get();
        const totalXpGained = baseXp + bonusXp;
        const newTotalXp = s.totalXp + totalXpGained;
        const previousLevel = s.level;
        const newLevel = computeLevel(newTotalXp);
        const coinsEarned = Math.floor(baseXp / 5);
        const today = todayStr();

        const completion: QuestCompletion = {
          questId,
          goalId,
          baseXp,
          bonusXp,
          completedAt: new Date().toISOString(),
        };

        // Cap history at 500
        const newHistory = [...s.questHistory, completion];
        if (newHistory.length > 500) newHistory.splice(0, newHistory.length - 500);

        set({
          totalXp: newTotalXp,
          level: newLevel,
          coins: s.coins + coinsEarned,
          dailyQuestsCompleted: s.dailyDate === today
            ? [...s.dailyQuestsCompleted, questId]
            : [questId],
          dailyDate: today,
          questHistory: newHistory,
        });

        return {
          xpEarned: totalXpGained,
          coinsEarned,
          totalXp: newTotalXp,
          previousLevel,
          currentLevel: newLevel,
          leveledUp: newLevel > previousLevel,
          streakUpdated: false,
          currentStreak: s.currentStreak,
          milestoneCompleted: false,
          roadmapProgress: 0,
        };
      },

      undoQuestCompletion: (questId, xpToRemove) => {
        const s = get();
        const newTotalXp = Math.max(0, s.totalXp - xpToRemove);
        set({
          totalXp: newTotalXp,
          level: computeLevel(newTotalXp),
          coins: Math.max(0, s.coins - Math.floor(xpToRemove / 5)),
          dailyQuestsCompleted: s.dailyQuestsCompleted.filter(id => id !== questId),
          questHistory: s.questHistory.filter(q => q.questId !== questId),
        });
      },

      checkAndResetDaily: () => {
        const s = get();
        const today = todayStr();
        if (s.dailyDate !== today) {
          set({
            dailyQuestsCompleted: [],
            dailyDate: today,
            energyCrystals: s.maxEnergyCrystals,
          });
        }
      },

      updateStreak: () => {
        const s = get();
        const today = todayStr();
        if (s.lastActivityDate === today) return; // already counted today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        let newStreak: number;
        if (s.lastActivityDate === yesterdayStr) {
          // Consecutive day
          newStreak = s.currentStreak + 1;
        } else {
          // Gap — no guilt, just reset to 1
          newStreak = 1;
        }

        set({
          currentStreak: newStreak,
          longestStreak: Math.max(s.longestStreak, newStreak),
          lastActivityDate: today,
        });
      },

      unlockAchievement: (id) => {
        const s = get();
        if (s.unlockedAchievements.includes(id)) return;
        set({ unlockedAchievements: [...s.unlockedAchievements, id] });
      },

      toggleQuietMode: () => set((s) => ({ quietMode: !s.quietMode })),

      consumeCrystal: () =>
        set((s) => ({ energyCrystals: Math.max(0, s.energyCrystals - 1) })),

      rechargeCrystals: () =>
        set((s) => ({ energyCrystals: s.maxEnergyCrystals })),

      triggerXpAnimation: (amount) =>
        set({ xpAnimation: { amount, active: true } }),
      clearXpAnimation: () =>
        set({ xpAnimation: { amount: 0, active: false } }),
      triggerLevelUp: () => set({ levelUpAnimation: true }),
      clearLevelUp: () => set({ levelUpAnimation: false }),

      reset: () => set(initialState),
    }),
    {
      name: 'plan2skill-progression',
      partialize: (state) => {
        // Exclude transient animation state
        const { xpAnimation, levelUpAnimation, ...persisted } = state;
        return persisted;
      },
      onRehydrateStorage: () => {
        return (_state) => {
          // Migration bridge: copy onboarding XP → progressionStore on first hydrate
          if (typeof window === 'undefined') return;
          try {
            const raw = localStorage.getItem('plan2skill-onboarding');
            if (!raw) return;
            const onb = JSON.parse(raw);
            const onbXp: number = onb?.state?.xpTotal ?? 0;
            const progRaw = localStorage.getItem('plan2skill-progression');
            const prog = progRaw ? JSON.parse(progRaw) : null;
            const progXp: number = prog?.state?.totalXp ?? 0;

            // Only migrate if onboarding has XP and progression doesn't yet
            if (onbXp > 0 && progXp === 0) {
              const newLevel = computeLevel(onbXp);
              useProgressionStore.setState({
                totalXp: onbXp,
                level: newLevel,
              });
            }
          } catch {
            // Silent — migration is best-effort
          }
        };
      },
    },
  ),
);

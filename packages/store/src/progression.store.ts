import { create } from 'zustand';

interface ProgressionState {
  totalXp: number;
  level: number;
  coins: number;
  energyCrystals: number;
  maxEnergyCrystals: number;
  currentStreak: number;
  longestStreak: number;

  // Animation state
  xpAnimation: { amount: number; active: boolean };
  levelUpAnimation: boolean;

  setProgression: (data: {
    totalXp: number;
    level: number;
    coins: number;
    energyCrystals: number;
    maxEnergyCrystals: number;
  }) => void;
  setStreak: (current: number, longest: number) => void;
  addXp: (amount: number) => void;
  triggerXpAnimation: (amount: number) => void;
  clearXpAnimation: () => void;
  triggerLevelUp: () => void;
  clearLevelUp: () => void;
  consumeCrystal: () => void;
  rechargeCrystals: () => void;
  reset: () => void;
}

export const useProgressionStore = create<ProgressionState>((set) => ({
  totalXp: 0,
  level: 1,
  coins: 0,
  energyCrystals: 3,
  maxEnergyCrystals: 3,
  currentStreak: 0,
  longestStreak: 0,
  xpAnimation: { amount: 0, active: false },
  levelUpAnimation: false,

  setProgression: (data) => set(data),
  setStreak: (currentStreak, longestStreak) => set({ currentStreak, longestStreak }),
  addXp: (amount) =>
    set((s) => ({ totalXp: s.totalXp + amount })),
  triggerXpAnimation: (amount) =>
    set({ xpAnimation: { amount, active: true } }),
  clearXpAnimation: () =>
    set({ xpAnimation: { amount: 0, active: false } }),
  triggerLevelUp: () => set({ levelUpAnimation: true }),
  clearLevelUp: () => set({ levelUpAnimation: false }),
  consumeCrystal: () =>
    set((s) => ({ energyCrystals: Math.max(0, s.energyCrystals - 1) })),
  rechargeCrystals: () =>
    set((s) => ({ energyCrystals: s.maxEnergyCrystals })),
  reset: () =>
    set({
      totalXp: 0,
      level: 1,
      coins: 0,
      energyCrystals: 3,
      maxEnergyCrystals: 3,
      currentStreak: 0,
      longestStreak: 0,
      xpAnimation: { amount: 0, active: false },
      levelUpAnimation: false,
    }),
}));

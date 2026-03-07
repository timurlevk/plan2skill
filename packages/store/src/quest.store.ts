import { create } from 'zustand';

// ═══════════════════════════════════════════
// QUEST STORE — Daily quests from server
// Phase W1: Quest Engine Wire-Up
// ═══════════════════════════════════════════

/** Server task shape matching quest.daily tRPC response */
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  taskType: string;
  questType: string;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  rarity: string;
  difficultyTier: number;
  validationType: string;
  knowledgeCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } | null;
  skillDomain: string | null;
  roadmapId: string;
  roadmapTitle: string;
  roadmapTier: string;
}

interface QuestStoreState {
  /** Today's available quests fetched from quest.daily */
  dailyQuests: DailyQuest[];
  /** Today's completed quests */
  completedToday: DailyQuest[];
  /** AI quest generation in progress */
  isGenerating: boolean;
  /** YYYY-MM-DD of last successful fetch (day boundary detection) */
  lastFetchDate: string | null;

  setDailyQuests: (quests: DailyQuest[]) => void;
  setCompletedToday: (quests: DailyQuest[]) => void;
  addGeneratedQuests: (quests: DailyQuest[]) => void;
  setGenerating: (val: boolean) => void;
  clearQuests: () => void;
}

export const useQuestStore = create<QuestStoreState>((set) => ({
  dailyQuests: [],
  completedToday: [],
  isGenerating: false,
  lastFetchDate: null,

  setDailyQuests: (quests) => set({
    dailyQuests: quests,
    lastFetchDate: new Date().toISOString().split('T')[0],
  }),

  setCompletedToday: (quests) => set({ completedToday: quests }),

  addGeneratedQuests: (quests) => set((state) => ({
    dailyQuests: [...state.dailyQuests, ...quests],
    lastFetchDate: new Date().toISOString().split('T')[0],
  })),

  setGenerating: (val) => set({ isGenerating: val }),

  clearQuests: () => set({ dailyQuests: [], completedToday: [], lastFetchDate: null }),
}));

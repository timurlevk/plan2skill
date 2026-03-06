import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NarrativeMode, EpisodeCardData } from '@plan2skill/types';

// ═══════════════════════════════════════════
// NARRATIVE STORE — Zustand + persist
// Manages narrative mode, today's episode, legend state
// localStorage key: plan2skill-narrative
// ═══════════════════════════════════════════

interface NarrativeState {
  // Data
  narrativeMode: NarrativeMode;
  todayEpisode: EpisodeCardData | null;
  legendCompleted: boolean;

  // UI state (transient — not persisted)
  episodeExpanded: boolean;
  episodeDismissed: boolean;

  // Actions
  setNarrativeMode: (mode: NarrativeMode) => void;
  setTodayEpisode: (episode: EpisodeCardData | null) => void;
  expandEpisode: () => void;
  dismissEpisode: () => void;
  markEpisodeRead: () => void;
  completeLegend: () => void;
  reset: () => void;
}

const initialState = {
  narrativeMode: 'full' as NarrativeMode,
  todayEpisode: null as EpisodeCardData | null,
  legendCompleted: false,
  episodeExpanded: false,
  episodeDismissed: false,
};

// Hydration tracking
let _narrativeHydrated = false;
let _narrativeHydratedResolve: () => void;
export const narrativeHydratedPromise = new Promise<void>((r) => { _narrativeHydratedResolve = r; });
export function isNarrativeHydrated() { return _narrativeHydrated; }

export const useNarrativeStore = create<NarrativeState>()(
  persist(
    (set) => ({
      ...initialState,

      setNarrativeMode: (mode) => set({ narrativeMode: mode }),

      setTodayEpisode: (episode) => set({
        todayEpisode: episode,
        episodeExpanded: false,
        episodeDismissed: false,
      }),

      expandEpisode: () => set({ episodeExpanded: true }),

      dismissEpisode: () => set({
        episodeDismissed: true,
        episodeExpanded: false,
      }),

      markEpisodeRead: () => set((s) => ({
        todayEpisode: s.todayEpisode
          ? { ...s.todayEpisode, isRead: true }
          : null,
      })),

      completeLegend: () => set({ legendCompleted: true }),

      reset: () => set(initialState),
    }),
    {
      name: 'plan2skill-narrative',
      partialize: (state) => ({
        narrativeMode: state.narrativeMode,
        todayEpisode: state.todayEpisode,
        legendCompleted: state.legendCompleted,
        // Exclude transient UI state: episodeExpanded, episodeDismissed
      }),
      onRehydrateStorage: () => () => {
        _narrativeHydrated = true;
        _narrativeHydratedResolve();
      },
    },
  ),
);

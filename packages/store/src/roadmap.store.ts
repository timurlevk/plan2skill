import { create } from 'zustand';
import type { Roadmap, Task, RoadmapCompletionStats, TrendingDomain, RoadmapStatus } from '@plan2skill/types';

interface RoadmapState {
  roadmaps: Roadmap[];
  activeRoadmap: Roadmap | null;
  todaysTasks: Task[];
  isGenerating: boolean;
  // BL-007: Completion stats + trending
  completionStats: RoadmapCompletionStats | null;
  trendingDomains: TrendingDomain[];

  setRoadmaps: (roadmaps: Roadmap[]) => void;
  setActiveRoadmap: (roadmap: Roadmap | null) => void;
  setTodaysTasks: (tasks: Task[]) => void;
  setGenerating: (isGenerating: boolean) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
  setCompletionStats: (stats: RoadmapCompletionStats | null) => void;
  setTrendingDomains: (domains: TrendingDomain[]) => void;
  // Phase 5H: Roadmap lifecycle
  pauseRoadmap: (roadmapId: string) => void;
  resumeRoadmap: (roadmapId: string) => void;
  archiveRoadmap: (roadmapId: string) => void;
  reactivateRoadmap: (roadmapId: string) => void;
  updateRoadmap: (roadmap: Roadmap) => void;
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapState>((set) => ({
  roadmaps: [],
  activeRoadmap: null,
  todaysTasks: [],
  isGenerating: false,
  completionStats: null,
  trendingDomains: [],

  setRoadmaps: (roadmaps) => set({ roadmaps }),
  setActiveRoadmap: (activeRoadmap) => set({ activeRoadmap }),
  setTodaysTasks: (todaysTasks) => set({ todaysTasks }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  updateTaskStatus: (taskId, status) =>
    set((s) => ({
      todaysTasks: s.todaysTasks.map((t) =>
        t.id === taskId ? { ...t, status: status as Task['status'] } : t,
      ),
    })),
  setCompletionStats: (completionStats) => set({ completionStats }),
  setTrendingDomains: (trendingDomains) => set({ trendingDomains }),
  // Phase 5H: optimistic status updates
  pauseRoadmap: (roadmapId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? { ...r, status: 'paused' as RoadmapStatus } : r,
      ),
    })),
  resumeRoadmap: (roadmapId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? { ...r, status: 'active' as RoadmapStatus } : r,
      ),
    })),
  archiveRoadmap: (roadmapId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? { ...r, status: 'archived' as RoadmapStatus, archivedAt: new Date().toISOString() }
          : r,
      ),
    })),
  reactivateRoadmap: (roadmapId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? { ...r, status: 'paused' as RoadmapStatus, archivedAt: null }
          : r,
      ),
    })),
  updateRoadmap: (roadmap) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) => (r.id === roadmap.id ? roadmap : r)),
    })),
  reset: () =>
    set({
      roadmaps: [],
      activeRoadmap: null,
      todaysTasks: [],
      isGenerating: false,
      completionStats: null,
      trendingDomains: [],
    }),
}));

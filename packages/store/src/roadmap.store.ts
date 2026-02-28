import { create } from 'zustand';
import type { Roadmap, Task } from '@plan2skill/types';

interface RoadmapState {
  roadmaps: Roadmap[];
  activeRoadmap: Roadmap | null;
  todaysTasks: Task[];
  isGenerating: boolean;
  forgeProgress: number;
  forgePhase: string;

  setRoadmaps: (roadmaps: Roadmap[]) => void;
  setActiveRoadmap: (roadmap: Roadmap | null) => void;
  setTodaysTasks: (tasks: Task[]) => void;
  setForgeState: (isGenerating: boolean, progress: number, phase: string) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
  reset: () => void;
}

export const useRoadmapStore = create<RoadmapState>((set) => ({
  roadmaps: [],
  activeRoadmap: null,
  todaysTasks: [],
  isGenerating: false,
  forgeProgress: 0,
  forgePhase: '',

  setRoadmaps: (roadmaps) => set({ roadmaps }),
  setActiveRoadmap: (activeRoadmap) => set({ activeRoadmap }),
  setTodaysTasks: (todaysTasks) => set({ todaysTasks }),
  setForgeState: (isGenerating, forgeProgress, forgePhase) =>
    set({ isGenerating, forgeProgress, forgePhase }),
  updateTaskStatus: (taskId, status) =>
    set((s) => ({
      todaysTasks: s.todaysTasks.map((t) =>
        t.id === taskId ? { ...t, status: status as Task['status'] } : t,
      ),
    })),
  reset: () =>
    set({
      roadmaps: [],
      activeRoadmap: null,
      todaysTasks: [],
      isGenerating: false,
      forgeProgress: 0,
      forgePhase: '',
    }),
}));

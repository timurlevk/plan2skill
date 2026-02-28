import { create } from 'zustand';
import type { ArchetypeId, CompanionId } from '@plan2skill/types';

interface OnboardingState {
  step: number;
  totalSteps: number;
  identity: string;
  superpower: string;
  experienceLevel: string;
  selectedTools: string[];
  dailyMinutes: number;
  selectedArchetype: ArchetypeId | null;
  selectedCharacter: string | null;
  selectedCompanion: CompanionId | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setIdentity: (identity: string) => void;
  setSuperpower: (superpower: string) => void;
  setExperienceLevel: (level: string) => void;
  setSelectedTools: (tools: string[]) => void;
  toggleTool: (tool: string) => void;
  setDailyMinutes: (minutes: number) => void;
  setArchetype: (archetype: ArchetypeId) => void;
  setCharacter: (character: string) => void;
  setCompanion: (companion: CompanionId) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  totalSteps: 7,
  identity: '',
  superpower: '',
  experienceLevel: '',
  selectedTools: [] as string[],
  dailyMinutes: 30,
  selectedArchetype: null as ArchetypeId | null,
  selectedCharacter: null as string | null,
  selectedCompanion: null as CompanionId | null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, s.totalSteps - 1) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  setIdentity: (identity) => set({ identity }),
  setSuperpower: (superpower) => set({ superpower }),
  setExperienceLevel: (experienceLevel) => set({ experienceLevel }),
  setSelectedTools: (selectedTools) => set({ selectedTools }),
  toggleTool: (tool) =>
    set((s) => ({
      selectedTools: s.selectedTools.includes(tool)
        ? s.selectedTools.filter((t) => t !== tool)
        : [...s.selectedTools, tool],
    })),
  setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
  setArchetype: (selectedArchetype) => set({ selectedArchetype }),
  setCharacter: (selectedCharacter) => set({ selectedCharacter }),
  setCompanion: (selectedCompanion) => set({ selectedCompanion }),
  reset: () => set(initialState),
}));

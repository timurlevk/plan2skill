import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ArchetypeId, CharacterId } from '@plan2skill/types';
import type { GoalSelection, SkillAssessment } from '@plan2skill/types';

// ═══════════════════════════════════════════
// ONBOARDING STORE — 5-step schema
// /goals → /skills → /timeline → /archetype → /forge
// Persisted to localStorage
// ═══════════════════════════════════════════

interface OnboardingState {
  // Step 1: Goals
  selectedGoals: GoalSelection[];

  // Step 2: Skill Assessment
  skillAssessments: SkillAssessment[];

  // Step 3: Timeline
  dailyMinutes: number;
  targetMonths: number;
  aiEstimateWeeks: number;

  // Step 4: Archetype + Avatar
  archetypeId: ArchetypeId | null;
  archetypeQuizAnswers: number[];
  characterId: CharacterId | null;

  // Step 5: Forge
  forgeComplete: boolean;

  // XP System
  xpTotal: number;
  level: number;

  // Equipment
  receivedEquipment: string[];

  // Goals enrichment
  goalFreeText: Record<string, string>;
  goalSubGoals: Record<string, string[]>;

  // Actions — Goals
  setGoals: (goals: GoalSelection[]) => void;
  addGoal: (goal: GoalSelection) => void;
  removeGoal: (goalId: string) => void;

  // Actions — Skills
  setSkillAssessment: (assessment: SkillAssessment) => void;
  setSkillFreeText: (goalId: string, text: string) => void;

  // Actions — Timeline
  setTimeline: (dailyMinutes: number, targetMonths: number, aiEstimateWeeks: number) => void;

  // Actions — Archetype
  setArchetype: (archetypeId: ArchetypeId) => void;
  setArchetypeQuizAnswers: (answers: number[]) => void;
  setCharacter: (characterId: CharacterId) => void;

  // Actions — Forge
  setForgeComplete: (complete: boolean) => void;

  // Actions — XP
  addXP: (amount: number) => void;

  // Actions — Equipment
  addEquipment: (slot: string) => void;

  // Actions — Goal enrichment
  setGoalFreeText: (goalId: string, text: string) => void;
  setGoalSubGoals: (goalId: string, subGoalIds: string[]) => void;

  // Utilities
  clearDownstream: (fromStep: number) => void;
  reset: () => void;
}

const initialState = {
  selectedGoals: [] as GoalSelection[],
  skillAssessments: [] as SkillAssessment[],
  dailyMinutes: 30,
  targetMonths: 3,
  aiEstimateWeeks: 0,
  archetypeId: null as ArchetypeId | null,
  archetypeQuizAnswers: [] as number[],
  characterId: null as CharacterId | null,
  forgeComplete: false,
  xpTotal: 0,
  level: 1,
  receivedEquipment: [] as string[],
  goalFreeText: {} as Record<string, string>,
  goalSubGoals: {} as Record<string, string[]>,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      // Goals
      setGoals: (goals) => set({ selectedGoals: goals }),
      addGoal: (goal) => set((s) => ({
        selectedGoals: s.selectedGoals.length < 3
          ? [...s.selectedGoals, goal]
          : s.selectedGoals,
      })),
      removeGoal: (goalId) => set((s) => ({
        selectedGoals: s.selectedGoals.filter((g) => g.id !== goalId),
      })),

      // Skills
      setSkillAssessment: (assessment) => set((s) => {
        const existing = s.skillAssessments.filter(
          (a) => a.goalId !== assessment.goalId
        );
        return { skillAssessments: [...existing, assessment] };
      }),

      setSkillFreeText: (goalId, text) => set((s) => {
        const updated = s.skillAssessments.map((a) =>
          a.goalId === goalId ? { ...a, freeTextNote: text } : a
        );
        return { skillAssessments: updated };
      }),

      // Timeline
      setTimeline: (dailyMinutes, targetMonths, aiEstimateWeeks) =>
        set({ dailyMinutes, targetMonths, aiEstimateWeeks }),

      // Archetype
      setArchetype: (archetypeId) => set({ archetypeId }),
      setArchetypeQuizAnswers: (answers) => set({ archetypeQuizAnswers: answers }),
      setCharacter: (characterId) => set({ characterId }),

      // Forge
      setForgeComplete: (complete) => set({ forgeComplete: complete }),

      // XP — level = floor(xpTotal / 100) + 1
      addXP: (amount) => set((s) => {
        const newXP = s.xpTotal + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        return { xpTotal: newXP, level: newLevel };
      }),

      // Equipment
      addEquipment: (slot) => set((s) => ({
        receivedEquipment: s.receivedEquipment.includes(slot)
          ? s.receivedEquipment
          : [...s.receivedEquipment, slot],
      })),

      // Goal enrichment
      setGoalFreeText: (goalId, text) => set((s) => ({
        goalFreeText: { ...s.goalFreeText, [goalId]: text },
      })),
      setGoalSubGoals: (goalId, subGoalIds) => set((s) => ({
        goalSubGoals: { ...s.goalSubGoals, [goalId]: subGoalIds },
      })),

      // Clear downstream data when user changes a previous step
      // step numbers: 1=goals, 2=skills, 3=timeline, 4=archetype, 5=forge
      clearDownstream: (fromStep) => set((s) => {
        const updates: Partial<typeof initialState> = {};
        if (fromStep <= 1) {
          updates.skillAssessments = [];
        }
        if (fromStep <= 2) {
          updates.dailyMinutes = 30;
          updates.targetMonths = 3;
          updates.aiEstimateWeeks = 0;
        }
        if (fromStep <= 3) {
          updates.archetypeId = null;
          updates.archetypeQuizAnswers = [];
          updates.characterId = null;
        }
        if (fromStep <= 4) {
          updates.forgeComplete = false;
        }
        return updates;
      }),

      // Full reset
      reset: () => set(initialState),
    }),
    {
      name: 'plan2skill-onboarding',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ArchetypeId, CharacterId, OnboardingIntent, DiscoveryPath,
  AssessmentLevel, AssessmentQuestionType,
} from '@plan2skill/types';
import type { PerformanceGoal, SkillAssessmentV2 } from '@plan2skill/types';

// ═══════════════════════════════════════════
// ONBOARDING v2 STORE — Intent-based branching
// /intent → /goal/{direct|guided|career} → /assessment → /character → /first-quest
// Persisted to localStorage
// ═══════════════════════════════════════════

// Supported locales (pre-seeded in DB)
export const SUPPORTED_LOCALES = ['en', 'uk', 'pl'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Locales shown in the picker dropdown
export const PICKER_LOCALES = SUPPORTED_LOCALES;

export const LOCALE_ENDONYMS: Record<SupportedLocale, string> = {
  en: 'English',
  uk: 'Українська',
  pl: 'Polski',
};

// Auto-detect user locale from browser
// Russian (ru) detected → maps to Ukrainian (uk)
export function detectLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'en';
  const langs = navigator.languages || [navigator.language];
  for (const lang of langs) {
    const code = lang.split('-')[0]?.toLowerCase();
    if (code === 'ru' || code === 'uk') return 'uk';
    if (code && (SUPPORTED_LOCALES as readonly string[]).includes(code)) {
      return code as SupportedLocale;
    }
  }
  return 'en';
}

interface OnboardingV2State {
  // Locale (pre-auth, syncs to user.locale post-auth)
  locale: SupportedLocale;

  // Step 1: Intent
  intent: OnboardingIntent | null;

  // Step 2: Discovery
  discoveryPath: DiscoveryPath | null;
  // 2A: Direct
  dreamGoal: string;
  performanceGoals: PerformanceGoal[];
  // 2B: Guided
  selectedDomain: string | null;
  selectedInterests: string[];
  customInterests: string[];
  guidedAssessmentLevel: AssessmentLevel | null;
  guidedCustomGoals: string[];
  // 2C: Career
  careerCurrent: string;
  careerPains: string[];
  careerTarget: string | null;

  // Step 3: Assessment
  assessments: SkillAssessmentV2[];

  // AI assessment (pre-generated during Legend for guided flow)
  aiAssessmentQuestions: AssessmentQuestionType[] | null;
  aiAssessmentStatus: 'idle' | 'loading' | 'ready' | 'error';

  // Step 4: Character
  characterId: CharacterId | null;
  inferredArchetypeId: ArchetypeId | null;
  overrideArchetypeId: ArchetypeId | null;

  // Step 5: Completion
  onboardingCompletedAt: number | null;

  // XP System
  xpTotal: number;
  level: number;

  // ─── Actions ───

  // Locale
  setLocale: (locale: SupportedLocale) => void;

  // Step 1
  setIntent: (intent: OnboardingIntent) => void;

  // Step 2A
  setDreamGoal: (text: string) => void;
  setPerformanceGoals: (goals: PerformanceGoal[]) => void;
  addPerformanceGoal: (goal: PerformanceGoal) => void;
  removePerformanceGoal: (id: string) => void;
  updatePerformanceGoal: (id: string, text: string) => void;

  // Step 2B
  setSelectedDomain: (domain: string) => void;
  toggleInterest: (interest: string) => void;
  addCustomInterest: (interest: string) => void;
  setGuidedAssessmentLevel: (level: AssessmentLevel) => void;
  addGuidedCustomGoal: (goal: string) => void;
  removeGuidedCustomGoal: (index: number) => void;
  clearGuidedCustomGoals: () => void;

  // Step 2C
  setCareerCurrent: (role: string) => void;
  toggleCareerPain: (pain: string) => void;
  setCareerTarget: (target: string) => void;

  // Step 3
  setAssessment: (assessment: SkillAssessmentV2) => void;

  // AI assessment
  setAiAssessmentQuestions: (questions: AssessmentQuestionType[]) => void;
  setAiAssessmentStatus: (status: 'idle' | 'loading' | 'ready' | 'error') => void;

  // Step 4
  setCharacter: (characterId: CharacterId) => void;
  setInferredArchetype: (archetypeId: ArchetypeId) => void;
  setOverrideArchetype: (archetypeId: ArchetypeId | null) => void;

  // Step 5
  completeOnboarding: () => void;

  // XP
  addXP: (amount: number) => void;

  // Utilities
  reset: () => void;
}

const initialState = {
  locale: 'en' as SupportedLocale,
  intent: null as OnboardingIntent | null,
  discoveryPath: null as DiscoveryPath | null,
  dreamGoal: '',
  performanceGoals: [] as PerformanceGoal[],
  selectedDomain: null as string | null,
  selectedInterests: [] as string[],
  customInterests: [] as string[],
  guidedAssessmentLevel: null as AssessmentLevel | null,
  guidedCustomGoals: [] as string[],
  careerCurrent: '',
  careerPains: [] as string[],
  careerTarget: null as string | null,
  assessments: [] as SkillAssessmentV2[],
  aiAssessmentQuestions: null as AssessmentQuestionType[] | null,
  aiAssessmentStatus: 'idle' as 'idle' | 'loading' | 'ready' | 'error',
  characterId: null as CharacterId | null,
  inferredArchetypeId: null as ArchetypeId | null,
  overrideArchetypeId: null as ArchetypeId | null,
  onboardingCompletedAt: null as number | null,
  xpTotal: 0,
  level: 1,
};

// Hydration tracking — resolves when localStorage is loaded
let _v2Hydrated = false;
let _v2HydratedResolve: () => void;
export const onboardingV2HydratedPromise = new Promise<void>((r) => { _v2HydratedResolve = r; });
export function isOnboardingV2Hydrated() { return _v2Hydrated; }

export const useOnboardingV2Store = create<OnboardingV2State>()(
  persist(
    (set) => ({
      ...initialState,

      // Locale
      setLocale: (locale) => set({ locale }),

      // Step 1: Intent
      setIntent: (intent) => set({
        intent,
        discoveryPath: intent === 'know' ? 'direct'
          : intent === 'explore_guided' ? 'guided'
          : intent === 'career' ? 'career'
          : null,
      }),

      // Step 2A: Direct Goal
      setDreamGoal: (text) => set({ dreamGoal: text }),
      setPerformanceGoals: (goals) => set({ performanceGoals: goals }),
      addPerformanceGoal: (goal) => set((s) => ({
        performanceGoals: [...s.performanceGoals, goal],
      })),
      removePerformanceGoal: (id) => set((s) => ({
        performanceGoals: s.performanceGoals.filter((g) => g.id !== id),
      })),
      updatePerformanceGoal: (id, text) => set((s) => ({
        performanceGoals: s.performanceGoals.map((g) =>
          g.id === id ? { ...g, text } : g
        ),
      })),

      // Step 2B: Guided Discovery
      setSelectedDomain: (domain) => set({
        selectedDomain: domain,
        selectedInterests: [],
        customInterests: [],
        guidedAssessmentLevel: null,
        guidedCustomGoals: [],
      }),
      toggleInterest: (interest) => set((s) => {
        const has = s.selectedInterests.includes(interest);
        if (has) {
          return { selectedInterests: [] };
        }
        return { selectedInterests: [interest] };
      }),
      addCustomInterest: (interest) => set((s) => ({
        customInterests: [...s.customInterests, interest],
        selectedInterests: [interest],
      })),
      setGuidedAssessmentLevel: (level) => set({ guidedAssessmentLevel: level }),
      addGuidedCustomGoal: (goal) => set((s) => {
        if (s.guidedCustomGoals.length >= 5) return s;
        const trimmed = goal.trim().slice(0, 200);
        if (!trimmed) return s;
        return { guidedCustomGoals: [...s.guidedCustomGoals, trimmed] };
      }),
      removeGuidedCustomGoal: (index) => set((s) => ({
        guidedCustomGoals: s.guidedCustomGoals.filter((_, i) => i !== index),
      })),
      clearGuidedCustomGoals: () => set({ guidedCustomGoals: [] }),

      // Step 2C: Career Path
      setCareerCurrent: (role) => set({ careerCurrent: role }),
      toggleCareerPain: (pain) => set((s) => {
        const has = s.careerPains.includes(pain);
        if (has) {
          return { careerPains: s.careerPains.filter((p) => p !== pain) };
        }
        if (s.careerPains.length >= 3) return s;
        return { careerPains: [...s.careerPains, pain] };
      }),
      setCareerTarget: (target) => set({ careerTarget: target }),

      // Step 3: Assessment
      setAssessment: (assessment) => set((s) => {
        const existing = s.assessments.filter(
          (a) => !(a.domain === assessment.domain && a.method === assessment.method),
        );
        return { assessments: [...existing, assessment] };
      }),

      // AI assessment
      setAiAssessmentQuestions: (questions) => set({ aiAssessmentQuestions: questions }),
      setAiAssessmentStatus: (status) => set({ aiAssessmentStatus: status }),

      // Step 4: Character
      setCharacter: (characterId) => set({ characterId }),
      setInferredArchetype: (archetypeId) => set({ inferredArchetypeId: archetypeId }),
      setOverrideArchetype: (archetypeId) => set({ overrideArchetypeId: archetypeId }),

      // Step 5: Completion
      completeOnboarding: () => set({ onboardingCompletedAt: Date.now() }),

      // XP — level = floor(xpTotal / 100) + 1
      addXP: (amount) => set((s) => {
        const newXP = s.xpTotal + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        return { xpTotal: newXP, level: newLevel };
      }),

      // Full reset
      reset: () => set(initialState),
    }),
    {
      name: 'plan2skill-onboarding-v2',
      onRehydrateStorage: () => () => {
        _v2Hydrated = true;
        _v2HydratedResolve();
      },
    }
  )
);

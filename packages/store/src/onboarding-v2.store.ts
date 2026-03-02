import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ArchetypeId, CharacterId, OnboardingIntent, DiscoveryPath,
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
  intentSelectedAt: number | null;

  // Step 2: Discovery
  discoveryPath: DiscoveryPath | null;
  // 2A: Direct
  dreamGoal: string;
  performanceGoals: PerformanceGoal[];
  // 2B: Guided
  selectedDomain: string | null;
  selectedInterests: string[];
  customInterests: string[];
  // 2C: Career
  careerCurrent: string;
  careerPains: string[];
  careerTarget: string | null;

  // Step 3: Assessment
  assessments: SkillAssessmentV2[];

  // Step 4: Character
  characterId: CharacterId | null;
  inferredArchetypeId: ArchetypeId | null;
  overrideArchetypeId: ArchetypeId | null;

  // Step 5: First Quest
  firstQuestStarted: boolean;
  firstQuestTasks: boolean[];
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

  // Step 2C
  setCareerCurrent: (role: string) => void;
  toggleCareerPain: (pain: string) => void;
  setCareerTarget: (target: string) => void;

  // Step 3
  setAssessment: (assessment: SkillAssessmentV2) => void;

  // Step 4
  setCharacter: (characterId: CharacterId) => void;
  setInferredArchetype: (archetypeId: ArchetypeId) => void;
  setOverrideArchetype: (archetypeId: ArchetypeId | null) => void;

  // Step 5
  setFirstQuestStarted: () => void;
  toggleFirstQuestTask: (index: number) => void;
  completeOnboarding: () => void;

  // XP
  addXP: (amount: number) => void;

  // Utilities
  reset: () => void;
}

const initialState = {
  locale: 'en' as SupportedLocale,
  intent: null as OnboardingIntent | null,
  intentSelectedAt: null as number | null,
  discoveryPath: null as DiscoveryPath | null,
  dreamGoal: '',
  performanceGoals: [] as PerformanceGoal[],
  selectedDomain: null as string | null,
  selectedInterests: [] as string[],
  customInterests: [] as string[],
  careerCurrent: '',
  careerPains: [] as string[],
  careerTarget: null as string | null,
  assessments: [] as SkillAssessmentV2[],
  characterId: null as CharacterId | null,
  inferredArchetypeId: null as ArchetypeId | null,
  overrideArchetypeId: null as ArchetypeId | null,
  firstQuestStarted: false,
  firstQuestTasks: [false, false, false] as boolean[],
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
        intentSelectedAt: Date.now(),
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
      }),
      toggleInterest: (interest) => set((s) => {
        const has = s.selectedInterests.includes(interest);
        if (has) {
          return { selectedInterests: s.selectedInterests.filter((i) => i !== interest) };
        }
        if (s.selectedInterests.length >= 5) return s;
        return { selectedInterests: [...s.selectedInterests, interest] };
      }),
      addCustomInterest: (interest) => set((s) => ({
        customInterests: [...s.customInterests, interest],
        selectedInterests: s.selectedInterests.length < 5
          ? [...s.selectedInterests, interest]
          : s.selectedInterests,
      })),

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
        const existing = s.assessments.filter((a) => a.domain !== assessment.domain);
        return { assessments: [...existing, assessment] };
      }),

      // Step 4: Character
      setCharacter: (characterId) => set({ characterId }),
      setInferredArchetype: (archetypeId) => set({ inferredArchetypeId: archetypeId }),
      setOverrideArchetype: (archetypeId) => set({ overrideArchetypeId: archetypeId }),

      // Step 5: First Quest
      setFirstQuestStarted: () => set({ firstQuestStarted: true }),
      toggleFirstQuestTask: (index) => set((s) => {
        const tasks = [...s.firstQuestTasks];
        tasks[index] = !tasks[index];
        return { firstQuestTasks: tasks };
      }),
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

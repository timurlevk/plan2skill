import { create } from 'zustand';

// ═══════════════════════════════════════════
// SKILL STORE — Skill Elo ratings + assessment state
// Phase W2: Assessment & Skill Elo Wire-Up
// ═══════════════════════════════════════════

/** Elo rating per skill domain — matches skillElo.list response */
export interface SkillEloEntry {
  skillDomain: string;
  elo: number;
}

/** Single assessment question — matches AiQuestion from backend */
export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bloomLevel: string;
  skillDomain: string;
  difficultyElo: number;
  distractorTypes: string[];
}

/** Result after submitting assessment — matches AssessmentResult from backend */
export interface AssessmentResult {
  score: number;
  total: number;
  percentage: number;
  initialElo: number;
  skillDomain: string;
  questionResults: Array<{
    questionIndex: number;
    correct: boolean;
    correctIndex: number;
    explanation: string;
  }>;
}

interface SkillStoreState {
  /** All user skill Elo ratings */
  skillElos: SkillEloEntry[];

  /** Current in-progress assessment questions (from assessment.generate) */
  assessmentQuestions: AssessmentQuestion[] | null;
  /** Target Bloom taxonomy level for current assessment */
  assessmentBloomLevel: string | null;
  /** Skill domain being assessed */
  assessmentDomain: string | null;

  /** Last assessment result (from assessment.submit) */
  lastResult: AssessmentResult | null;

  setSkillElos: (elos: SkillEloEntry[]) => void;
  updateSkillElo: (skillDomain: string, elo: number) => void;
  setAssessment: (domain: string, questions: AssessmentQuestion[], bloomLevel: string) => void;
  setLastResult: (result: AssessmentResult) => void;
  clearAssessment: () => void;
}

export const useSkillStore = create<SkillStoreState>((set) => ({
  skillElos: [],
  assessmentQuestions: null,
  assessmentBloomLevel: null,
  assessmentDomain: null,
  lastResult: null,

  setSkillElos: (elos) => set({ skillElos: elos }),

  updateSkillElo: (skillDomain, elo) =>
    set((state) => {
      const idx = state.skillElos.findIndex((e) => e.skillDomain === skillDomain);
      if (idx >= 0) {
        const next = [...state.skillElos];
        next[idx] = { skillDomain, elo };
        return { skillElos: next };
      }
      return { skillElos: [...state.skillElos, { skillDomain, elo }] };
    }),

  setAssessment: (domain, questions, bloomLevel) =>
    set({
      assessmentDomain: domain,
      assessmentQuestions: questions,
      assessmentBloomLevel: bloomLevel,
    }),

  setLastResult: (result) => set({ lastResult: result }),

  clearAssessment: () =>
    set({
      assessmentQuestions: null,
      assessmentBloomLevel: null,
      assessmentDomain: null,
      lastResult: null,
    }),
}));

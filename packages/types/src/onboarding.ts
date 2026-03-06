import type { DiscoveryPath, OnboardingIntent, AssessmentLevel, AssessmentMethod } from './enums';

// ═══════════════════════════════════════════
// ASSESSMENT QUESTION TYPE — shared between frontend & store
// Mirrors frontend AssessmentQuestion interface
// ═══════════════════════════════════════════

export interface AssessmentQuestionType {
  id: string;
  domain: string;
  difficulty: 1 | 2 | 3;
  question: string;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  npcReaction: {
    correct: string;
    wrong: string;
    correctEmotion: 'neutral' | 'happy' | 'impressed' | 'thinking';
    wrongEmotion: 'neutral' | 'happy' | 'impressed' | 'thinking';
  };
}

// ═══════════════════════════════════════════
// ONBOARDING CONTEXT — passed to AI milestone generator
// Discriminated union by `path` field
// Assembled on frontend from Zustand store
// ═══════════════════════════════════════════

interface OnboardingContextBase {
  path: DiscoveryPath;
  intent: OnboardingIntent;
  locale: string;
  dreamGoal: string;
}

export interface DirectPathContext extends OnboardingContextBase {
  path: 'direct';
}

export interface GuidedPathContext extends OnboardingContextBase {
  path: 'guided';
  selectedDomain: string;
  selectedInterests: string[];
  customInterests: string[];
  skillLevel: AssessmentLevel | null;
  customGoals: string[];
  assessments: Array<{
    domain: string;
    level: AssessmentLevel;
    method: AssessmentMethod;
    score: number;
    confidence: number;
  }>;
}

export interface CareerPathContext extends OnboardingContextBase {
  path: 'career';
  careerCurrent: string;
  careerPains: string[];
  careerTarget: string | null;
}

export type OnboardingContext = DirectPathContext | GuidedPathContext | CareerPathContext;

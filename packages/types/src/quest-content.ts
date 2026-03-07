// ─── Quest Content Pipeline Types ──────────────────────────────

import type { ContentBlock } from './content-blocks';
import type { Exercise } from './exercises';

export interface QuestContentPackage {
  taskId: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  contentFormat: string;
  articleBody: string | null;
  quizQuestions: QuizQuestion[] | null;
  resources: ResourceItem[] | null;
  funFacts: FunFactItem[] | null;
  codeChallenge: CodeChallengeContent | null;
  contentBlocks: ContentBlock[] | null;
  exercises: Exercise[] | null;
  aiHintsRemaining: number;
  aiTutorAvailable: boolean;
  lockedFeatures: LockedFeature[];
}

export interface CodeChallengeContent {
  title: string;
  description: string;
  starterCode: string;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  hints: string[];
  solutionExplanation: string;
}

export type QuizDistractorType = 'plausible-wrong' | 'common-misconception' | 'partial-truth' | 'off-topic';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bloomLevel?: string;
  distractorTypes?: QuizDistractorType[];
}

export interface ResourceItem {
  title: string;
  url: string;
  type: string;
  description: string;
  difficulty: string;
  freeAccess: boolean;
}

export interface FunFactItem {
  fact: string;
  category: string;
  source?: string;
}

export interface LockedFeature {
  type: 'code_challenge' | 'resources' | 'ai_tutor' | 'explanation' | 'fun_facts';
  teaser: string;
  unlockMethod: 'coins' | 'upgrade';
  coinCost: number | null;
  requiredTier: 'pro' | 'champion';
}

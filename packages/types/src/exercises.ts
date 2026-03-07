// ─── Exercise Types (Discriminated Union) ───────────────────────

export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

export type ExerciseType =
  | 'mcq'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'drag_drop'
  | 'code_completion'
  | 'free_text'
  | 'parsons';

interface ExerciseBase {
  id: string;
  difficulty: ExerciseDifficulty;
  bloomLevel: string;
  points: number;
}

export interface MCQExercise extends ExerciseBase {
  type: 'mcq';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrueFalseExercise extends ExerciseBase {
  type: 'true_false';
  statement: string;
  correctAnswer: boolean;
  explanation: string;
}

export interface FillBlankExercise extends ExerciseBase {
  type: 'fill_blank';
  sentence: string;
  acceptedAnswers: string[];
  explanation: string;
}

export interface MatchingExercise extends ExerciseBase {
  type: 'matching';
  pairs: { left: string; right: string }[];
  explanation: string;
}

export interface DragDropExercise extends ExerciseBase {
  type: 'drag_drop';
  items: string[];
  correctOrder: string[];
  explanation: string;
}

export interface CodeCompletionExercise extends ExerciseBase {
  type: 'code_completion';
  starterCode: string;
  solution: string;
  testCases: string[];
  hints: string[];
  language: string;
}

export interface FreeTextExercise extends ExerciseBase {
  type: 'free_text';
  prompt: string;
  rubric: string;
  sampleAnswer: string;
  keywords: string[];
}

export interface ParsonsExercise extends ExerciseBase {
  type: 'parsons';
  codeLines: string[];
  correctOrder: string[];
  language: string;
  explanation: string;
}

export type Exercise =
  | MCQExercise
  | TrueFalseExercise
  | FillBlankExercise
  | MatchingExercise
  | DragDropExercise
  | CodeCompletionExercise
  | FreeTextExercise
  | ParsonsExercise;

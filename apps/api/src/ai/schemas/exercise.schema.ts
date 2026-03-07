import { z } from 'zod';
import { BloomLevelSchema } from './shared.schema';

// ─── Exercise Difficulty & Type Enums ──────────────────────────

export const ExerciseDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const ExerciseTypeSchema = z.enum([
  'mcq',
  'true_false',
  'fill_blank',
  'matching',
  'drag_drop',
  'code_completion',
  'free_text',
  'parsons',
]);

// ─── Base Fields (shared by all exercise types) ────────────────

const exerciseBaseFields = {
  id: z.string().min(1).max(50),
  difficulty: ExerciseDifficultySchema,
  bloomLevel: BloomLevelSchema,
  points: z.number().int().min(1).max(100),
};

// ─── Per-Type Schemas (discriminated union on "type") ──────────

const MCQExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('mcq'),
  question: z.string().min(10).max(500),
  options: z.array(z.string().min(1).max(300)).min(3).max(6),
  correctIndex: z.number().int().min(0).max(5),
  explanation: z.string().min(10).max(500),
});

const TrueFalseExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('true_false'),
  statement: z.string().min(10).max(500),
  correctAnswer: z.boolean(),
  explanation: z.string().min(10).max(500),
});

const FillBlankExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('fill_blank'),
  sentence: z.string().min(10).max(500),
  acceptedAnswers: z.array(z.string().min(1).max(200)).min(1).max(10),
  explanation: z.string().min(10).max(500),
});

const MatchingExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('matching'),
  pairs: z
    .array(z.object({ left: z.string().min(1).max(200), right: z.string().min(1).max(200) }))
    .min(2)
    .max(8),
  explanation: z.string().min(10).max(500),
});

const DragDropExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('drag_drop'),
  items: z.array(z.string().min(1).max(200)).min(2).max(10),
  correctOrder: z.array(z.string().min(1).max(200)).min(2).max(10),
  explanation: z.string().min(10).max(500),
});

const CodeCompletionExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('code_completion'),
  starterCode: z.string().min(5).max(2000),
  solution: z.string().min(5).max(2000),
  testCases: z.array(z.string().min(1).max(500)).min(1).max(10),
  hints: z.array(z.string().min(1).max(300)).min(0).max(5),
  language: z.string().min(1).max(50),
});

const FreeTextExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('free_text'),
  prompt: z.string().min(10).max(500),
  rubric: z.string().min(10).max(1000),
  sampleAnswer: z.string().min(10).max(2000),
  keywords: z.array(z.string().min(1).max(100)).min(1).max(10),
});

const ParsonsExerciseSchema = z.object({
  ...exerciseBaseFields,
  type: z.literal('parsons'),
  codeLines: z.array(z.string().min(1).max(500)).min(2).max(15),
  correctOrder: z.array(z.string().min(1).max(500)).min(2).max(15),
  language: z.string().min(1).max(50),
  explanation: z.string().min(10).max(500),
});

// ─── Discriminated Union ───────────────────────────────────────

export const ExerciseSchema = z.discriminatedUnion('type', [
  MCQExerciseSchema,
  TrueFalseExerciseSchema,
  FillBlankExerciseSchema,
  MatchingExerciseSchema,
  DragDropExerciseSchema,
  CodeCompletionExerciseSchema,
  FreeTextExerciseSchema,
  ParsonsExerciseSchema,
]);

// ─── AI Exercise Set (top-level output schema) ─────────────────

export const AiExerciseSetSchema = z.object({
  exercises: z.array(ExerciseSchema).min(2).max(5),
});

export type AiExerciseSetResult = z.infer<typeof AiExerciseSetSchema>;

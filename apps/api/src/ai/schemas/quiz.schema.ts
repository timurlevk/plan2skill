import { z } from 'zod';
import { BloomLevelSchema } from './shared.schema';

// ─── Distractor Type ────────────────────────────────────────────

export const QuizDistractorTypeSchema = z.enum([
  'plausible-wrong',
  'common-misconception',
  'partial-truth',
  'off-topic',
]);

// ─── AI Quiz Question ───────────────────────────────────────────

export const AiQuizQuestionSchema = z.object({
  question: z.string().min(10).max(500),
  options: z.array(z.string().min(1).max(300)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(500),
  bloomLevel: BloomLevelSchema,
  distractorTypes: z.array(QuizDistractorTypeSchema).min(1).max(4),
});

export type AiQuizQuestion = z.infer<typeof AiQuizQuestionSchema>;

// ─── AI Quiz ────────────────────────────────────────────────────

export const AiQuizSchema = z.object({
  questions: z.array(AiQuizQuestionSchema).min(3).max(10),
});

export type AiQuizResult = z.infer<typeof AiQuizSchema>;

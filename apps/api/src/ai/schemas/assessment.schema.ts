import { z } from 'zod';
import { BloomLevelSchema } from './shared.schema';

// ─── Distractor Type ────────────────────────────────────────────

export const DistractorTypeSchema = z.enum([
  'common_misconception',
  'partial_knowledge',
  'similar_concept',
  'syntax_error',
]);

// ─── AI Question ────────────────────────────────────────────────

export const AiQuestionSchema = z
  .object({
    question: z.string().min(10).max(500),
    options: z.array(z.string().min(1).max(300)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(10).max(500),
    bloomLevel: BloomLevelSchema,
    skillDomain: z.string().min(1).max(50),
    difficultyElo: z.number().int().min(800).max(2000),
    distractorTypes: z.array(DistractorTypeSchema).length(3),
  })
  .refine(
    (q) => {
      // Exactly one correct answer: correctIndex must point to a valid option
      return q.correctIndex >= 0 && q.correctIndex < q.options.length;
    },
    { message: 'correctIndex must point to a valid option' },
  );

export type AiQuestion = z.infer<typeof AiQuestionSchema>;

// ─── AI Assessment ──────────────────────────────────────────────

export const AiAssessmentSchema = z.object({
  questions: z.array(AiQuestionSchema).min(3).max(20),
  targetBloomLevel: BloomLevelSchema,
  skillDomain: z.string().min(1).max(50),
});

export type AiAssessment = z.infer<typeof AiAssessmentSchema>;

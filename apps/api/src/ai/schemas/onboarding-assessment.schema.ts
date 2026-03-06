import { z } from 'zod';

// ─── Onboarding Assessment — AI-generated quiz questions ─────
// Output must match frontend AssessmentQuestion interface exactly
// so AI questions pass through adaptive logic (getNextQuestion,
// shouldStopAssessment, computeLevel) without any mapping.

export const OnboardingAssessmentOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1).max(50),
        domain: z.string().min(1).max(50),
        difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        question: z.string().min(10).max(500),
        options: z
          .array(
            z.object({
              id: z.enum(['a', 'b', 'c', 'd']),
              text: z.string().min(1).max(300),
              correct: z.boolean(),
            }),
          )
          .length(4),
        npcReaction: z.object({
          correct: z.string().min(1).max(300),
          wrong: z.string().min(1).max(300),
          correctEmotion: z.enum(['neutral', 'happy', 'impressed', 'thinking']),
          wrongEmotion: z.enum(['neutral', 'happy', 'impressed', 'thinking']),
        }),
      }),
    )
    .length(5),
});

export type OnboardingAssessmentOutput = z.infer<typeof OnboardingAssessmentOutputSchema>;

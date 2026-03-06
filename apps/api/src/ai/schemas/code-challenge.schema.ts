import { z } from 'zod';

// ─── Test Case ──────────────────────────────────────────────────

export const AiTestCaseSchema = z.object({
  input: z.string().min(1).max(1000),
  expectedOutput: z.string().min(1).max(1000),
  isHidden: z.boolean(),
});

export type AiTestCase = z.infer<typeof AiTestCaseSchema>;

// ─── AI Code Challenge ──────────────────────────────────────────

export const AiCodeChallengeSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  starterCode: z.string().min(1).max(2000),
  testCases: z.array(AiTestCaseSchema).min(3).max(5),
  hints: z.array(z.string().min(5).max(300)).min(2).max(4),
  solutionExplanation: z.string().min(10).max(1000),
});

export type AiCodeChallengeResult = z.infer<typeof AiCodeChallengeSchema>;

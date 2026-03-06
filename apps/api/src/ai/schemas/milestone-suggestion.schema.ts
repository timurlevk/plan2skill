import { z } from 'zod';

// ─── Milestone Suggestion — AI-generated milestones for onboarding ─────

export const MilestoneSuggestionSchema = z.object({
  milestones: z
    .array(
      z.object({
        id: z.string().min(1).max(50),
        text: z.string().min(3).max(200),
        weeks: z.number().int().min(1).max(26),
      }),
    )
    .min(3)
    .max(6),
});

export type MilestoneSuggestionResult = z.infer<typeof MilestoneSuggestionSchema>;

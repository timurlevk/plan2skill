import { z } from 'zod';

// ─── Interest Suggestion — AI-generated interests for unknown domains ─────

export const InterestSuggestionOutputSchema = z.object({
  interests: z
    .array(
      z.object({
        id: z.string().min(1).max(50),
        label: z.string().min(2).max(100),
      }),
    )
    .min(6)
    .max(10),
});

export type InterestSuggestionOutput = z.infer<typeof InterestSuggestionOutputSchema>;

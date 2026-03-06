import { z } from 'zod';

// ─── Tone ───────────────────────────────────────────────────────

export const MotivationalToneSchema = z.enum([
  'encouraging',
  'celebratory',
  'epic',
  'gentle',
]);

// ─── AI Motivational ────────────────────────────────────────────

export const AiMotivationalSchema = z.object({
  message: z.string().min(5).max(500),
  tone: MotivationalToneSchema,
  emoji: z.string().max(10).optional(),
});

export type AiMotivationalResult = z.infer<typeof AiMotivationalSchema>;

import { z } from 'zod';

// ─── Fact Category ──────────────────────────────────────────────

export const FactCategorySchema = z.enum([
  'history',
  'science',
  'industry',
  'surprising',
]);

// ─── AI Fun Fact Item ───────────────────────────────────────────

export const AiFunFactItemSchema = z.object({
  fact: z.string().min(10).max(500),
  category: FactCategorySchema,
  source: z.string().max(200).optional(),
});

export type AiFunFactItem = z.infer<typeof AiFunFactItemSchema>;

// ─── AI Fun Fact ────────────────────────────────────────────────

export const AiFunFactSchema = z.object({
  facts: z.array(AiFunFactItemSchema).min(3).max(5),
});

export type AiFunFactResult = z.infer<typeof AiFunFactSchema>;

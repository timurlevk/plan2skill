import { z } from 'zod';

// ─── Resource Type ──────────────────────────────────────────────

export const ResourceTypeSchema = z.enum([
  'article',
  'video',
  'documentation',
  'course',
  'tool',
]);

// ─── Difficulty Level ───────────────────────────────────────────

export const ResourceDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);

// ─── AI Resource Item ───────────────────────────────────────────

export const AiResourceItemSchema = z.object({
  title: z.string().min(5).max(200),
  url: z.string().min(5).max(500),
  type: ResourceTypeSchema,
  description: z.string().min(10).max(500),
  difficulty: ResourceDifficultySchema,
  freeAccess: z.boolean(),
});

export type AiResourceItem = z.infer<typeof AiResourceItemSchema>;

// ─── AI Resource ────────────────────────────────────────────────

export const AiResourceSchema = z.object({
  resources: z.array(AiResourceItemSchema).min(3).max(7),
});

export type AiResourceResult = z.infer<typeof AiResourceSchema>;

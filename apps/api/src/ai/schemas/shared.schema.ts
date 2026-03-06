import { z } from 'zod';

// ─── Shared Enums ───────────────────────────────────────────────

export const TaskTypeSchema = z.enum([
  'video',
  'article',
  'quiz',
  'project',
  'review',
  'boss',
]);

export const RaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]);

export const BloomLevelSchema = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

export const QuestTypeSchema = z.enum([
  'knowledge',
  'practice',
  'creative',
  'boss',
  'physical',
  'habit',
  'social',
  'reflection',
]);

// ─── Flow Category ──────────────────────────────────────────────

export const FlowCategorySchema = z.enum(['stretch', 'mastery', 'review']);

// ─── Knowledge Check ────────────────────────────────────────────

export const KnowledgeCheckSchema = z.object({
  question: z.string().min(10).max(500),
  options: z.array(z.string().min(1).max(200)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(500),
});

export type KnowledgeCheck = z.infer<typeof KnowledgeCheckSchema>;

import { z } from 'zod';
import {
  TaskTypeSchema,
  RaritySchema,
  BloomLevelSchema,
  QuestTypeSchema,
  KnowledgeCheckSchema,
} from './shared.schema';

// ─── Flow Category ──────────────────────────────────────────────

export const FlowCategorySchema = z.enum(['stretch', 'mastery', 'review']);

// ─── AI Quest ───────────────────────────────────────────────────

export const AiQuestSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  taskType: TaskTypeSchema,
  questType: QuestTypeSchema,
  estimatedMinutes: z.number().int().min(5).max(120),
  xpReward: z.number().int().min(10).max(500),
  coinReward: z.number().int().min(1).max(50),
  rarity: RaritySchema,
  skillDomain: z.string().min(1).max(50),
  bloomLevel: BloomLevelSchema,
  flowCategory: FlowCategorySchema,
  difficultyTier: z.number().int().min(1).max(5),
  knowledgeCheck: KnowledgeCheckSchema.optional(),
});

export type AiQuest = z.infer<typeof AiQuestSchema>;

// ─── AI Quest Batch ─────────────────────────────────────────────

export const AiQuestBatchSchema = z.object({
  quests: z.array(AiQuestSchema).min(1).max(10),
});

export type AiQuestBatch = z.infer<typeof AiQuestBatchSchema>;

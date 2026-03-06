import { z } from 'zod';
import {
  TaskTypeSchema,
  RaritySchema,
  BloomLevelSchema,
  QuestTypeSchema,
  FlowCategorySchema,
} from './shared.schema';

// ─── AI Task ────────────────────────────────────────────────────

export const AiTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  taskType: TaskTypeSchema,
  questType: QuestTypeSchema.optional(),
  flowCategory: FlowCategorySchema.optional(),
  estimatedMinutes: z.number().int().min(5).max(120),
  xpReward: z.number().int().min(10).max(500),
  coinReward: z.number().int().min(1).max(50),
  rarity: RaritySchema,
  skillDomain: z.string().min(1).max(50),
  bloomLevel: BloomLevelSchema,
  difficultyTier: z.number().int().min(1).max(5).optional(),
});

export type AiTask = z.infer<typeof AiTaskSchema>;

// ─── AI Milestone ───────────────────────────────────────────────

export const AiMilestoneSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  weekStart: z.number().int().min(1).max(52),
  weekEnd: z.number().int().min(1).max(52),
  tasks: z.array(AiTaskSchema).min(5).max(20),
});

export type AiMilestone = z.infer<typeof AiMilestoneSchema>;

// ─── Discriminated Union: Boss Decision ─────────────────────────

const StandardMilestoneSchema = z.object({
  type: z.literal('standard_tasks'),
  milestone: AiMilestoneSchema,
});

const BossMilestoneSchema = z.object({
  type: z.literal('include_boss'),
  milestone: AiMilestoneSchema,
  bossTask: AiTaskSchema.extend({
    taskType: z.literal('boss'),
    rarity: z.enum(['epic', 'legendary']),
  }),
});

export const MilestoneDecisionSchema = z.discriminatedUnion('type', [
  StandardMilestoneSchema,
  BossMilestoneSchema,
]);

export type MilestoneDecision = z.infer<typeof MilestoneDecisionSchema>;

// ─── AI Roadmap (top-level output schema) ───────────────────────

export const AiRoadmapSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  milestones: z.array(AiMilestoneSchema).min(4).max(12),
});

export type AiRoadmapResult = z.infer<typeof AiRoadmapSchema>;

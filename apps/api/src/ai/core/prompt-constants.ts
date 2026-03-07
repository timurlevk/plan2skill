import {
  TaskTypeSchema,
  QuestTypeSchema,
  RaritySchema,
  BloomLevelSchema,
  FlowCategorySchema,
} from '../schemas/shared.schema';

// ─── Enum Documentation (derived from Zod — single source of truth) ──

export const TASK_TYPE_DOC = TaskTypeSchema.options.join('|');
export const QUEST_TYPE_DOC = QuestTypeSchema.options.join('|');
export const RARITY_DOC = RaritySchema.options.join('|');
export const BLOOM_LEVEL_DOC = BloomLevelSchema.options.join('|');
export const FLOW_CATEGORY_DOC = FlowCategorySchema.options.join('|');

// ─── taskType → questType mapping ────────────────────────────────────

export const TASK_QUEST_TYPE_MAP: Record<string, string[]> = {
  article: ['knowledge'],
  quiz: ['knowledge', 'practice'],
  project: ['practice', 'creative'],
  review: ['knowledge', 'practice'],
  boss: ['boss'],
  reflection: ['reflection'],
};

// ─── XP reward ranges per rarity ─────────────────────────────────────

export const XP_BY_RARITY: Record<string, [min: number, max: number]> = {
  common: [15, 25],
  uncommon: [30, 50],
  rare: [60, 100],
  epic: [120, 200],
  legendary: [250, 500],
};

// ─── Coin reward ranges per taskType ─────────────────────────────────

export const COIN_BY_TASK_TYPE: Record<string, [min: number, max: number]> = {
  article: [5, 10],
  quiz: [5, 10],
  project: [15, 30],
  review: [5, 10],
  boss: [15, 30],
  reflection: [5, 10],
};

// ─── Rarity distribution targets ────────────────────────────────────

export const RARITY_DISTRIBUTION: Record<string, number> = {
  common: 40,
  uncommon: 25,
  rare: 20,
  epic: 10,
  legendary: 5,
};

import { z } from 'zod';

// ─── Quest Assistant Modes ──────────────────────────────────────

export const QuestAssistantModeSchema = z.enum([
  'hint',
  'feedback',
  'reattempt',
]);

export type QuestAssistantMode = z.infer<typeof QuestAssistantModeSchema>;

// ─── AI Quest Assistant ─────────────────────────────────────────

export const AiQuestAssistantSchema = z.object({
  mode: QuestAssistantModeSchema,
  message: z.string().min(5).max(2000),
  encouragement: z.string().max(200).optional(),
  nextSteps: z.array(z.string().max(200)).max(3).optional(),
});

export type AiQuestAssistantResult = z.infer<typeof AiQuestAssistantSchema>;

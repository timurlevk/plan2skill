import { z } from 'zod';

// ─── Priority ───────────────────────────────────────────────────

export const RecommendationPrioritySchema = z.enum([
  'high',
  'medium',
  'low',
]);

// ─── AI Recommendation Item ─────────────────────────────────────

export const AiRecommendationItemSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(500),
  skillDomain: z.string().min(1).max(50),
  reason: z.string().min(10).max(300),
  priority: RecommendationPrioritySchema,
});

export type AiRecommendationItem = z.infer<typeof AiRecommendationItemSchema>;

// ─── AI Recommendation ──────────────────────────────────────────

export const AiRecommendationSchema = z.object({
  recommendations: z.array(AiRecommendationItemSchema).min(3).max(7),
});

export type AiRecommendationResult = z.infer<typeof AiRecommendationSchema>;

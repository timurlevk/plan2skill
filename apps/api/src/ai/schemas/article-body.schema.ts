import { z } from 'zod';

// ─── AI Article Body ───────────────────────────────────────────

export const ArticleBodySchema = z.object({
  articleBody: z.string().min(100).max(10000),
});

export type ArticleBodyResult = z.infer<typeof ArticleBodySchema>;

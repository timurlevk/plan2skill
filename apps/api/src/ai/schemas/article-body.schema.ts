import { z } from 'zod';
import { ContentBlockSchema } from './content-blocks.schema';

// ─── AI Article Body (with structured content blocks) ──────────

export const ArticleBodySchema = z.object({
  articleBody: z.string().min(100).max(10000),
  blocks: z.array(ContentBlockSchema).min(1).max(10),
});

export type ArticleBodyResult = z.infer<typeof ArticleBodySchema>;

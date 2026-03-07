import { z } from 'zod';

// ─── Per-Block Schemas (discriminated union on "type") ─────────

const TextBlockSchema = z.object({
  type: z.literal('text'),
  heading: z.string().min(1).max(200).optional(),
  body: z.string().min(10).max(5000),
});

const CodeBlockSchema = z.object({
  type: z.literal('code'),
  language: z.string().min(1).max(50),
  code: z.string().min(1).max(5000),
  caption: z.string().min(1).max(300).optional(),
});

const CalloutBlockSchema = z.object({
  type: z.literal('callout'),
  variant: z.enum(['tip', 'warning', 'info', 'lore']),
  title: z.string().min(1).max(200),
  body: z.string().min(10).max(2000),
});

const InteractiveBlockSchema = z.object({
  type: z.literal('interactive'),
  prompt: z.string().min(10).max(500),
  answer: z.string().min(1).max(2000),
  hint: z.string().min(1).max(500).optional(),
});

const DeepLoreBlockSchema = z.object({
  type: z.literal('deep_lore'),
  title: z.string().min(1).max(200),
  body: z.string().min(10).max(3000),
});

// ─── Discriminated Union ───────────────────────────────────────

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  CodeBlockSchema,
  CalloutBlockSchema,
  InteractiveBlockSchema,
  DeepLoreBlockSchema,
]);

// ─── AI Content Blocks (top-level output schema) ───────────────

export const AiContentBlocksSchema = z.object({
  blocks: z.array(ContentBlockSchema).min(3).max(10),
});

export type AiContentBlocksResult = z.infer<typeof AiContentBlocksSchema>;

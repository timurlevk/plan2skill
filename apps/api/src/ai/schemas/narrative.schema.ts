import { z } from 'zod';

// ─── Tone Profile ───────────────────────────────────────────────

export const ToneProfileSchema = z.enum([
  'heroic',
  'mysterious',
  'whimsical',
  'dramatic',
  'contemplative',
]);

export type ToneProfile = z.infer<typeof ToneProfileSchema>;

// ─── Continuity Check ───────────────────────────────────────────

export const ContinuityCheckSchema = z.object({
  referencedCharacters: z.array(z.string()),
  referencedLocations: z.array(z.string()),
  plotThreadsContinued: z.array(z.string()),
  newPlotThreads: z.array(z.string()),
});

export type ContinuityCheck = z.infer<typeof ContinuityCheckSchema>;

// ─── AI Episode ─────────────────────────────────────────────────

export const AiEpisodeSchema = z.object({
  title: z.string().min(3).max(120),
  contextSentence: z.string().min(10).max(300),
  /** Body: 400-800 words ≈ 2400-4800 chars */
  body: z.string().min(2400).max(4800),
  cliffhanger: z.string().min(20).max(400),
  sageReflection: z.string().min(20).max(400),
  summary: z.string().min(20).max(500),
  tone: ToneProfileSchema,
  act: z.number().int().min(1).max(5),
  category: z.enum([
    'standard',
    'climax',
    'lore_drop',
    'character_focus',
    'season_finale',
  ]),
  continuity: ContinuityCheckSchema,
});

export type AiEpisodeResult = z.infer<typeof AiEpisodeSchema>;

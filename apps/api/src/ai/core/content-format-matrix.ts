import type { ContentFormat, DomainCategory } from './domain-capability';

type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

/** Weight map: format → probability weight (weights in each cell sum to ~1.0) */
export type FormatWeights = Partial<Record<ContentFormat, number>>;

/**
 * Bloom × Domain weight matrix (6 × 8 = 48 cells).
 * Each cell defines base weights for content format selection.
 */
const MATRIX: Record<BloomLevel, Record<DomainCategory, FormatWeights>> = {
  // ─── Remember: heavy on reading/watching ──────────────────────
  remember: {
    technical_coding:    { article: 0.4, video_rec: 0.3, quiz: 0.3 },
    technical_nocoding:  { article: 0.4, video_rec: 0.3, quiz: 0.3 },
    creative:            { article: 0.3, video_rec: 0.4, quiz: 0.3 },
    theoretical:         { article: 0.5, video_rec: 0.2, quiz: 0.3 },
    physical_practical:  { article: 0.3, video_rec: 0.4, quiz: 0.3 },
    business:            { article: 0.4, video_rec: 0.3, quiz: 0.3 },
    language:            { article: 0.3, video_rec: 0.3, quiz: 0.4 },
    health_wellness:     { article: 0.3, video_rec: 0.4, quiz: 0.3 },
  },

  // ─── Understand: start mixing in reflection ───────────────────
  understand: {
    technical_coding:    { article: 0.35, video_rec: 0.25, quiz: 0.3, code_challenge: 0.1 },
    technical_nocoding:  { article: 0.35, video_rec: 0.25, quiz: 0.3, hands_on: 0.1 },
    creative:            { article: 0.25, video_rec: 0.3, quiz: 0.2, reflection: 0.25 },
    theoretical:         { article: 0.4, video_rec: 0.2, quiz: 0.25, reflection: 0.15 },
    physical_practical:  { article: 0.2, video_rec: 0.35, quiz: 0.2, hands_on: 0.25 },
    business:            { article: 0.35, video_rec: 0.25, quiz: 0.25, reflection: 0.15 },
    language:            { article: 0.25, video_rec: 0.2, quiz: 0.35, hands_on: 0.2 },
    health_wellness:     { article: 0.25, video_rec: 0.3, quiz: 0.2, hands_on: 0.25 },
  },

  // ─── Apply: shift to practice ─────────────────────────────────
  apply: {
    technical_coding:    { code_challenge: 0.4, project: 0.3, quiz: 0.2, article: 0.1 },
    technical_nocoding:  { hands_on: 0.35, project: 0.3, quiz: 0.2, article: 0.15 },
    creative:            { hands_on: 0.35, project: 0.3, reflection: 0.2, video_rec: 0.15 },
    theoretical:         { quiz: 0.35, article: 0.3, reflection: 0.2, video_rec: 0.15 },
    physical_practical:  { hands_on: 0.5, video_rec: 0.2, reflection: 0.15, quiz: 0.15 },
    business:            { project: 0.35, quiz: 0.25, article: 0.2, reflection: 0.2 },
    language:            { hands_on: 0.4, quiz: 0.3, reflection: 0.15, video_rec: 0.15 },
    health_wellness:     { hands_on: 0.45, video_rec: 0.2, reflection: 0.2, quiz: 0.15 },
  },

  // ─── Analyze: deeper practice + assessment ────────────────────
  analyze: {
    technical_coding:    { code_challenge: 0.35, project: 0.25, quiz: 0.25, article: 0.15 },
    technical_nocoding:  { project: 0.3, hands_on: 0.3, quiz: 0.25, article: 0.15 },
    creative:            { project: 0.3, reflection: 0.3, hands_on: 0.25, quiz: 0.15 },
    theoretical:         { quiz: 0.3, reflection: 0.3, article: 0.25, video_rec: 0.15 },
    physical_practical:  { hands_on: 0.4, reflection: 0.25, quiz: 0.2, video_rec: 0.15 },
    business:            { project: 0.3, quiz: 0.25, reflection: 0.25, article: 0.2 },
    language:            { hands_on: 0.3, quiz: 0.3, reflection: 0.25, article: 0.15 },
    health_wellness:     { hands_on: 0.35, reflection: 0.3, quiz: 0.2, video_rec: 0.15 },
  },

  // ─── Evaluate: heavy assessment ───────────────────────────────
  evaluate: {
    technical_coding:    { code_challenge: 0.3, quiz: 0.3, project: 0.25, boss: 0.15 },
    technical_nocoding:  { project: 0.3, quiz: 0.3, hands_on: 0.25, boss: 0.15 },
    creative:            { project: 0.3, reflection: 0.3, quiz: 0.2, boss: 0.2 },
    theoretical:         { quiz: 0.35, reflection: 0.3, article: 0.2, boss: 0.15 },
    physical_practical:  { hands_on: 0.3, reflection: 0.25, quiz: 0.25, boss: 0.2 },
    business:            { project: 0.3, quiz: 0.25, reflection: 0.25, boss: 0.2 },
    language:            { quiz: 0.3, hands_on: 0.25, reflection: 0.25, boss: 0.2 },
    health_wellness:     { hands_on: 0.3, reflection: 0.25, quiz: 0.25, boss: 0.2 },
  },

  // ─── Create: synthesis + boss challenges ──────────────────────
  create: {
    technical_coding:    { project: 0.35, code_challenge: 0.25, boss: 0.25, quiz: 0.15 },
    technical_nocoding:  { project: 0.4, hands_on: 0.25, boss: 0.2, quiz: 0.15 },
    creative:            { project: 0.4, hands_on: 0.25, boss: 0.2, reflection: 0.15 },
    theoretical:         { reflection: 0.3, quiz: 0.3, boss: 0.25, article: 0.15 },
    physical_practical:  { hands_on: 0.35, project: 0.25, boss: 0.25, reflection: 0.15 },
    business:            { project: 0.4, boss: 0.25, reflection: 0.2, quiz: 0.15 },
    language:            { hands_on: 0.3, project: 0.25, boss: 0.25, quiz: 0.2 },
    health_wellness:     { hands_on: 0.3, project: 0.25, boss: 0.25, reflection: 0.2 },
  },
};

/** Get the base format weights for a given Bloom level × domain category */
export function getFormatWeights(
  bloomLevel: string,
  domainCategory: DomainCategory,
): FormatWeights {
  const bloomRow = MATRIX[bloomLevel as BloomLevel];
  if (!bloomRow) {
    // Default to 'remember' for unknown Bloom levels
    return MATRIX.remember[domainCategory] ?? MATRIX.remember.theoretical;
  }
  return bloomRow[domainCategory] ?? bloomRow.theoretical;
}

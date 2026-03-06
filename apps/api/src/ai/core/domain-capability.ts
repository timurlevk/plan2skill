// ─── Domain Categories ──────────────────────────────────────────

export const DOMAIN_CATEGORIES = [
  'technical_coding',
  'technical_nocoding',
  'creative',
  'theoretical',
  'physical_practical',
  'business',
  'language',
  'health_wellness',
] as const;

export type DomainCategory = (typeof DOMAIN_CATEGORIES)[number];

// ─── Domain Classification (LLM output) ────────────────────────

export interface DomainClassification {
  categories: DomainCategory[];
  primaryCategory: DomainCategory;
  hasCodingComponent: boolean;
  hasPhysicalComponent: boolean;
  hasCreativeComponent: boolean;
  primaryLanguage: string | null;
  suggestedTooling: string[];
}

// ─── Content Formats ────────────────────────────────────────────

export const CONTENT_FORMATS = [
  'article',
  'quiz',
  'code_challenge',
  'video_rec',
  'project',
  'reflection',
  'hands_on',
  'boss',
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];

// ─── Domain → Format Availability Matrix (§3.3) ────────────────

export const DOMAIN_FORMAT_AVAILABILITY: Record<DomainCategory, readonly ContentFormat[]> = {
  technical_coding:    ['article', 'quiz', 'code_challenge', 'video_rec', 'project', 'boss'],
  technical_nocoding:  ['article', 'quiz', 'video_rec', 'project', 'hands_on', 'boss'],
  creative:            ['article', 'quiz', 'video_rec', 'project', 'reflection', 'hands_on', 'boss'],
  theoretical:         ['article', 'quiz', 'video_rec', 'reflection', 'boss'],
  physical_practical:  ['article', 'quiz', 'video_rec', 'project', 'reflection', 'hands_on', 'boss'],
  business:            ['article', 'quiz', 'video_rec', 'project', 'reflection', 'boss'],
  language:            ['article', 'quiz', 'video_rec', 'reflection', 'hands_on', 'boss'],
  health_wellness:     ['article', 'quiz', 'video_rec', 'reflection', 'hands_on', 'boss'],
};

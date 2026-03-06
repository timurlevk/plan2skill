import type { ContentFormat, DomainClassification } from './domain-capability';
import { DOMAIN_FORMAT_AVAILABILITY } from './domain-capability';

// ─── Validation Result ──────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ─── Pre-Generation Validation ──────────────────────────────────

/** Check whether a format is valid for a given domain + tier before generation. */
export function validateFormatForDomain(
  format: ContentFormat,
  classification: DomainClassification,
  tier: string,
): ValidationResult {
  const errors: string[] = [];

  // Check domain availability
  const primary = classification.primaryCategory;
  const validFormats = DOMAIN_FORMAT_AVAILABILITY[primary];
  if (!validFormats.includes(format)) {
    errors.push(
      `Format "${format}" is not available for domain "${primary}"`,
    );
  }

  // Code challenge requires coding component
  if (format === 'code_challenge' && !classification.hasCodingComponent) {
    errors.push('Code challenges require a coding component');
  }

  // Hands-on requires physical_practical or creative domain
  if (format === 'hands_on') {
    const hasPhysicalOrCreative =
      classification.categories.includes('physical_practical') ||
      classification.categories.includes('creative');
    if (!hasPhysicalOrCreative) {
      errors.push(
        'Hands-on exercises require physical_practical or creative domain',
      );
    }
  }

  // Tier gating: code_challenge = Pro+
  if (format === 'code_challenge' && tier.toLowerCase() === 'free') {
    errors.push('Code challenges require Pro or Champion tier');
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

// ─── Post-Generation Validation ─────────────────────────────────

/** Basic sanity checks on LLM-generated content after generation. */
export function validateGeneratedContent(
  format: ContentFormat,
  content: unknown,
  classification: DomainClassification,
): ValidationResult {
  const errors: string[] = [];

  if (content == null) {
    return fail('Content is null or undefined');
  }

  switch (format) {
    case 'article': {
      if (typeof content !== 'string') {
        errors.push('Article body must be a string');
        break;
      }
      const wordCount = content.split(/\s+/).length;
      if (wordCount < 50) {
        errors.push(`Article too short: ${wordCount} words (min 50)`);
      }
      if (wordCount > 2000) {
        errors.push(`Article too long: ${wordCount} words (max 2000)`);
      }
      // Check for code blocks in non-coding domains
      if (!classification.hasCodingComponent && /```[\s\S]*?```/.test(content)) {
        errors.push('Article contains code blocks for a non-coding domain');
      }
      break;
    }

    case 'quiz': {
      if (!Array.isArray(content)) {
        errors.push('Quiz content must be an array');
        break;
      }
      for (let i = 0; i < content.length; i++) {
        const q = content[i] as Record<string, unknown> | undefined;
        if (!q) continue;
        if (!q.question || typeof q.question !== 'string') {
          errors.push(`Quiz question ${i}: missing question text`);
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`Quiz question ${i}: needs at least 2 options`);
        }
        if (
          typeof q.correctIndex !== 'number' ||
          q.correctIndex < 0 ||
          (Array.isArray(q.options) && q.correctIndex >= q.options.length)
        ) {
          errors.push(`Quiz question ${i}: correctIndex out of range`);
        }
      }
      break;
    }

    case 'code_challenge': {
      if (typeof content !== 'object' || content === null) {
        errors.push('Code challenge must be an object');
        break;
      }
      const challenge = content as Record<string, unknown>;
      if (!challenge.starterCode && classification.hasCodingComponent) {
        errors.push('Code challenge missing starterCode for coding domain');
      }
      if (!classification.hasCodingComponent) {
        errors.push('Code challenge generated for non-coding domain');
      }
      break;
    }

    default:
      // No specific validation for other formats yet
      break;
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

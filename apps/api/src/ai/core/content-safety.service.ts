import { Injectable, Logger } from '@nestjs/common';
import { ContentSafetyError } from './errors';

/** Regex patterns for prompt injection attempts */
const INJECTION_PATTERNS = [
  /system\s*:/i,
  /ignore\s+previous\s+instructions/i,
  /ignore\s+all\s+instructions/i,
  /you\s+are\s+now/i,
  /forget\s+everything/i,
  /disregard\s+(your|all|the)/i,
  /new\s+instruction/i,
  /override\s+system/i,
  /pretend\s+you/i,
  /act\s+as\s+if/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

const INPUT_MAX_LENGTH = 2000;

/** Strings that must never appear in AI output */
const OUTPUT_BLOCKLIST = [
  'ignore previous instructions',
  '<script',
  'javascript:',
  'data:text/html',
  'onerror=',
  'onload=',
];

@Injectable()
export class ContentSafetyService {
  private readonly logger = new Logger(ContentSafetyService.name);

  /**
   * Sanitize user input before sending to LLM.
   * Strips injection patterns, enforces length limit.
   * Never throws — returns sanitized string.
   */
  filterInput(text: string): string {
    let sanitized = text;

    // Truncate to max length
    if (sanitized.length > INPUT_MAX_LENGTH) {
      sanitized = sanitized.slice(0, INPUT_MAX_LENGTH);
    }

    // Strip injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        this.logger.warn(`Injection pattern detected and stripped: ${pattern.source}`);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return sanitized.trim();
  }

  /**
   * Scan AI output for unsafe content.
   * Recursively extracts all string values from the result.
   * Throws ContentSafetyError on blocklist match.
   */
  filterOutput(result: unknown): void {
    const strings = this.extractStrings(result);

    for (const { path, value } of strings) {
      const lower = value.toLowerCase();
      for (const blocked of OUTPUT_BLOCKLIST) {
        if (lower.includes(blocked)) {
          throw new ContentSafetyError(
            `Unsafe content detected in AI output: "${blocked}"`,
            path,
            blocked,
          );
        }
      }
    }
  }

  private extractStrings(
    obj: unknown,
    path = 'root',
  ): Array<{ path: string; value: string }> {
    const results: Array<{ path: string; value: string }> = [];

    if (typeof obj === 'string') {
      results.push({ path, value: obj });
    } else if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        results.push(...this.extractStrings(obj[i], `${path}[${i}]`));
      }
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        results.push(...this.extractStrings(value, `${path}.${key}`));
      }
    }

    return results;
  }
}

// ─── LLM Error Codes ────────────────────────────────────────────

export type LlmErrorCode =
  | 'RATE_LIMIT'
  | 'OVERLOADED'
  | 'TIMEOUT'
  | 'NO_RESPONSE'
  | 'ALL_MODELS_FAILED'
  | 'UNKNOWN';

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly code: LlmErrorCode,
    public readonly retriable: boolean,
    public readonly model?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

// ─── Validation Error ───────────────────────────────────────────

export interface ZodIssueInfo {
  path: (string | number)[];
  message: string;
  code: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly generatorType: string,
    public readonly zodIssues: ZodIssueInfo[],
    public readonly rawText?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ─── Content Safety Error ───────────────────────────────────────

export class ContentSafetyError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly matchedPattern: string,
  ) {
    super(message);
    this.name = 'ContentSafetyError';
  }
}

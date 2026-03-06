import type { ModelTier } from './types';

// ─── Injection Tokens ───────────────────────────────────────────

export const LLM_CLIENT_TOKEN = 'LLM_CLIENT_TOKEN';

// ─── LLM Call Options & Response ────────────────────────────────

export interface LlmCallOptions {
  tier: ModelTier;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  generatorType: string;
}

export interface LlmResponse {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  attempt: number;
  /** Anthropic: tokens written to prompt cache on this call */
  cacheCreationInputTokens?: number;
  /** Anthropic: tokens read from prompt cache on this call */
  cacheReadInputTokens?: number;
}

// ─── ILlmClient ─────────────────────────────────────────────────

export interface ILlmClient {
  call(options: LlmCallOptions): Promise<LlmResponse>;
}

// ─── ILlmTracer ─────────────────────────────────────────────────

export interface TrackSuccessData {
  userId: string;
  generatorType: string;
  model: string;
  purpose: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  attempt: number;
  cacheHit: boolean;
  systemPrompt?: string;
  userPrompt?: string;
  responseText?: string;
  structuredOutput?: unknown;
}

export interface TrackFailureData {
  userId: string;
  generatorType: string;
  model: string;
  purpose: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  attempt: number;
  errorMessage: string;
  systemPrompt?: string;
  userPrompt?: string;
}

export interface ILlmTracer {
  trackSuccess(data: TrackSuccessData): void;
  trackFailure(data: TrackFailureData): void;
}

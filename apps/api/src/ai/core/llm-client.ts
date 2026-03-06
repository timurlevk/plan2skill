import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  type LlmProvider,
  ModelTier,
  getModelTierDefinitions,
} from './types';
import { LlmError, type LlmErrorCode } from './errors';
import type { ILlmClient, LlmCallOptions, LlmResponse } from './interfaces';

@Injectable()
export class LlmClient implements ILlmClient {
  private readonly provider: LlmProvider;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  // Vercel AI SDK provider instances (lazy-initialized)
  private anthropicProvider?: ReturnType<typeof createAnthropic>;
  private openaiProvider?: ReturnType<typeof createOpenAI>;
  private googleProvider?: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(private readonly config: ConfigService) {
    this.provider = (this.config.get<string>('LLM_PROVIDER', 'anthropic') as LlmProvider);
    this.maxRetries = this.config.get<number>('LLM_MAX_RETRIES', 2);
    this.timeoutMs = this.config.get<number>('LLM_TIMEOUT_MS', 30_000);
  }

  async call(options: LlmCallOptions): Promise<LlmResponse> {
    if (options.tier === ModelTier.TEMPLATE) {
      throw new LlmError(
        'TEMPLATE tier does not use LLM calls',
        'UNKNOWN',
        false,
      );
    }

    const tierDefs = getModelTierDefinitions(this.provider);
    const tierDef = tierDefs[options.tier];
    const models = [tierDef.primary, ...tierDef.fallbacks];

    let lastError: LlmError | undefined;

    for (const model of models) {
      try {
        return await this.callWithRetry(model, options);
      } catch (err) {
        lastError =
          err instanceof LlmError
            ? err
            : new LlmError(String(err), 'UNKNOWN', false, model);

        if (!lastError.retriable && models.indexOf(model) === 0) {
          throw lastError;
        }
      }
    }

    throw new LlmError(
      `All models failed for ${options.generatorType}: ${lastError?.message}`,
      'ALL_MODELS_FAILED',
      false,
    );
  }

  private async callWithRetry(
    model: string,
    options: LlmCallOptions,
  ): Promise<LlmResponse> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      attempt++;
      const start = Date.now();

      try {
        const aiModel = this.resolveModel(model);
        const isAnthropic = model.startsWith('claude-');

        // Build messages with Anthropic prompt caching on system prompt
        const systemMsg = options.systemPrompt ? {
          role: 'system' as const,
          content: options.systemPrompt,
          ...(isAnthropic ? {
            providerOptions: {
              anthropic: { cacheControl: { type: 'ephemeral' } },
            },
          } : {}),
        } : null;
        const userMsg = { role: 'user' as const, content: options.userPrompt };

        const result = await generateText({
          model: aiModel,
          messages: systemMsg ? [systemMsg, userMsg] : [userMsg],
          maxOutputTokens: options.maxTokens,
          temperature: options.temperature,
          abortSignal: AbortSignal.timeout(this.timeoutMs),
        });

        const durationMs = Date.now() - start;

        if (!result.text) {
          throw new LlmError('No text response from AI', 'NO_RESPONSE', true, model);
        }

        // Extract Anthropic cache metadata if available
        const anthropicMeta = (result as any).providerMetadata?.anthropic;

        return {
          text: this.stripMarkdownFences(result.text),
          model,
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
          durationMs,
          attempt,
          cacheCreationInputTokens: anthropicMeta?.cacheCreationInputTokens,
          cacheReadInputTokens: anthropicMeta?.cacheReadInputTokens,
        };
      } catch (err) {
        if (err instanceof LlmError) {
          if (!err.retriable || attempt > this.maxRetries) throw err;
          await this.sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }

        // Handle AbortSignal timeout
        if (err instanceof DOMException && err.name === 'TimeoutError') {
          const timeoutErr = new LlmError(
            `Timeout after ${this.timeoutMs}ms`,
            'TIMEOUT',
            true,
            model,
          );
          if (attempt > this.maxRetries) throw timeoutErr;
          await this.sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }

        const classified = this.classifyError(err, model);
        if (!classified.retriable || attempt > this.maxRetries) throw classified;
        await this.sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    throw new LlmError(
      `Max retries exceeded for ${model}`,
      'ALL_MODELS_FAILED',
      false,
      model,
    );
  }

  /** Resolve a model string to a Vercel AI SDK model instance */
  private resolveModel(model: string) {
    if (model.startsWith('claude-')) {
      return this.getAnthropic()(model);
    }
    if (model.startsWith('gpt-')) {
      return this.getOpenAI()(model);
    }
    if (model.startsWith('gemini-')) {
      return this.getGoogle()(model);
    }
    throw new LlmError(`Unknown model: ${model}`, 'UNKNOWN', false, model);
  }

  private getAnthropic() {
    if (!this.anthropicProvider) {
      this.anthropicProvider = createAnthropic({
        apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
      });
    }
    return this.anthropicProvider;
  }

  private getOpenAI() {
    if (!this.openaiProvider) {
      this.openaiProvider = createOpenAI({
        apiKey: this.config.get<string>('OPENAI_API_KEY'),
      });
    }
    return this.openaiProvider;
  }

  private getGoogle() {
    if (!this.googleProvider) {
      this.googleProvider = createGoogleGenerativeAI({
        apiKey: this.config.get<string>('GOOGLE_AI_API_KEY'),
      });
    }
    return this.googleProvider;
  }

  private classifyError(err: unknown, model: string): LlmError {
    if (err instanceof LlmError) return err;

    const statusCode =
      err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status
        : undefined;

    const message =
      err instanceof Error ? err.message : String(err);

    const retriableStatuses = [429, 502, 503, 529];
    const codeMap: Record<number, LlmErrorCode> = {
      429: 'RATE_LIMIT',
      502: 'OVERLOADED',
      503: 'OVERLOADED',
      529: 'OVERLOADED',
    };

    if (statusCode && retriableStatuses.includes(statusCode)) {
      return new LlmError(
        message,
        codeMap[statusCode] ?? 'UNKNOWN',
        true,
        model,
        statusCode,
      );
    }

    return new LlmError(message, 'UNKNOWN', false, model, statusCode);
  }

  private stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('```')) {
      const firstNewline = trimmed.indexOf('\n');
      if (firstNewline === -1) return trimmed;
      const withoutOpen = trimmed.slice(firstNewline + 1);
      const lastFence = withoutOpen.lastIndexOf('```');
      if (lastFence === -1) return withoutOpen.trim();
      return withoutOpen.slice(0, lastFence).trim();
    }
    return trimmed;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

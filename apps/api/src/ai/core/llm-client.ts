import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ModelTier, MODEL_TIER_DEFINITIONS } from './types';
import { LlmError, type LlmErrorCode } from './errors';
import type { ILlmClient, LlmCallOptions, LlmResponse } from './interfaces';

@Injectable()
export class LlmClient implements ILlmClient {
  private readonly client: Anthropic;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
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

    const tierDef = MODEL_TIER_DEFINITIONS[options.tier];
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

        // If not retriable across models, stop immediately
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
        const response = await this.callWithTimeout(model, options);
        const durationMs = Date.now() - start;

        const textBlock = response.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          throw new LlmError('No text response from AI', 'NO_RESPONSE', true, model);
        }

        return {
          text: this.stripMarkdownFences(textBlock.text),
          model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          durationMs,
          attempt,
        };
      } catch (err) {
        if (err instanceof LlmError) {
          if (!err.retriable || attempt > this.maxRetries) throw err;
          // Exponential backoff: 1s, 2s, 4s...
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

  private callWithTimeout(
    model: string,
    options: LlmCallOptions,
  ): Promise<Anthropic.Message> {
    let timer: ReturnType<typeof setTimeout>;

    const callPromise = this.client.messages.create({
      model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userPrompt }],
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new LlmError(
              `Timeout after ${this.timeoutMs}ms`,
              'TIMEOUT',
              true,
              model,
            ),
          ),
        this.timeoutMs,
      );
    });

    return Promise.race([callPromise, timeoutPromise]).finally(() =>
      clearTimeout(timer),
    );
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
      // Remove opening fence (```json or ```)
      const firstNewline = trimmed.indexOf('\n');
      if (firstNewline === -1) return trimmed;
      const withoutOpen = trimmed.slice(firstNewline + 1);
      // Remove closing fence
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

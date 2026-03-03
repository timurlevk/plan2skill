import { Logger } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';
import type { ModelTier, GeneratorContext } from './types';
import type { ILlmClient, LlmResponse } from './interfaces';
import type { LlmTracer } from './llm-tracer';
import type { CacheService } from './cache.service';
import type { ContextEnrichmentService } from './context-enrichment.service';
import type { ContentSafetyService } from './content-safety.service';
import { ValidationError } from './errors';

export abstract class BaseGenerator<TInput, TOutput> {
  protected readonly logger: Logger;

  // ─── Abstract fields — must be set by each concrete generator ──
  protected abstract readonly generatorType: string;
  protected abstract readonly modelTier: ModelTier;
  protected abstract readonly temperature: number;
  protected abstract readonly maxTokens: number;
  protected abstract readonly outputSchema: ZodSchema<TOutput>;

  // ─── Abstract methods ─────────────────────────────────────────
  protected abstract buildSystemPrompt(context: GeneratorContext): string;
  protected abstract buildUserPrompt(
    input: TInput,
    context: GeneratorContext,
  ): string;

  // ─── Optional overrides ───────────────────────────────────────
  /** Return a cache key for this input, or null to skip caching */
  protected getCacheKey(_input: TInput, _context: GeneratorContext): string | null {
    return null;
  }

  /** TTL in seconds for cached results. Override in subclass. */
  protected cacheTtlSeconds = 0;

  constructor(
    protected readonly llmClient: ILlmClient,
    protected readonly tracer: LlmTracer,
    protected readonly cacheService: CacheService,
    protected readonly contextService: ContextEnrichmentService,
    protected readonly safetyService: ContentSafetyService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Sealed 10-step generation flow.
   *
   * 1. Build context
   * 2. Check cache
   * 3. Build prompts
   * 4. Filter input
   * 5. Call LLM
   * 6. Parse + validate
   * 7. Filter output
   * 8. Write cache
   * 9. Track success
   * 10. Return
   */
  async generate(userId: string, input: TInput): Promise<TOutput> {
    // Step 1: Build context
    const context = await this.contextService.build(userId, this.generatorType);

    // Step 2: Check cache
    const cacheKey = this.getCacheKey(input, context);
    if (cacheKey) {
      const cached = await this.cacheService.get<TOutput>(cacheKey);
      if (cached) {
        this.tracer.trackSuccess({
          userId,
          generatorType: this.generatorType,
          model: 'cache',
          purpose: this.generatorType,
          inputTokens: 0,
          outputTokens: 0,
          durationMs: 0,
          attempt: 0,
          cacheHit: true,
        });
        this.logger.debug(`Cache hit for ${this.generatorType}`);
        return cached;
      }
    }

    // Step 3: Build prompts
    const systemPrompt = this.buildSystemPrompt(context);
    const rawUserPrompt = this.buildUserPrompt(input, context);

    // Step 4: Filter input
    const userPrompt = this.safetyService.filterInput(rawUserPrompt);

    // Step 5: Call LLM
    let response: LlmResponse;
    try {
      response = await this.llmClient.call({
        tier: this.modelTier,
        systemPrompt,
        userPrompt,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
        generatorType: this.generatorType,
      });
    } catch (err) {
      this.tracer.trackFailure({
        userId,
        generatorType: this.generatorType,
        model: 'unknown',
        purpose: this.generatorType,
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        attempt: 0,
        errorMessage: err instanceof Error ? err.message : String(err),
        systemPrompt,
        userPrompt,
      });
      throw err;
    }

    // Step 6: Parse + Zod validate
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      this.tracer.trackFailure({
        userId,
        generatorType: this.generatorType,
        model: response.model,
        purpose: this.generatorType,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        durationMs: response.durationMs,
        attempt: response.attempt,
        errorMessage: 'JSON parse failed',
        systemPrompt,
        userPrompt,
      });
      throw new ValidationError(
        `JSON parse failed for ${this.generatorType}`,
        this.generatorType,
        [{ path: [], message: 'Invalid JSON', code: 'custom' }],
        response.text,
      );
    }

    const result = this.outputSchema.safeParse(parsed);
    if (!result.success) {
      const zodErr = result.error as ZodError;
      this.tracer.trackFailure({
        userId,
        generatorType: this.generatorType,
        model: response.model,
        purpose: this.generatorType,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        durationMs: response.durationMs,
        attempt: response.attempt,
        errorMessage: `Zod validation failed: ${zodErr.issues.map((i) => i.message).join(', ')}`,
        systemPrompt,
        userPrompt,
      });
      throw new ValidationError(
        `Zod validation failed for ${this.generatorType}`,
        this.generatorType,
        zodErr.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
        response.text,
      );
    }

    const validated = result.data;

    // Step 7: Filter output
    this.safetyService.filterOutput(validated);

    // Step 8: Write cache
    if (cacheKey && this.cacheTtlSeconds > 0) {
      this.cacheService
        .set(cacheKey, this.generatorType, validated, this.cacheTtlSeconds)
        .catch((err) =>
          this.logger.warn('Cache write failed', err),
        );
    }

    // Step 9: Track success
    this.tracer.trackSuccess({
      userId,
      generatorType: this.generatorType,
      model: response.model,
      purpose: this.generatorType,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      durationMs: response.durationMs,
      attempt: response.attempt,
      cacheHit: false,
      systemPrompt,
      userPrompt,
      responseText: response.text,
      structuredOutput: validated,
    });

    // Step 10: Return
    return validated;
  }
}

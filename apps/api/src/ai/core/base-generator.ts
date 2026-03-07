import { Logger } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';
import type { ModelTier, GeneratorContext } from './types';
import type { ILlmClient, LlmResponse } from './interfaces';
import type { LlmTracer } from './llm-tracer';
import type { CacheService } from './cache.service';
import type { ContextEnrichmentService } from './context-enrichment.service';
import type { ContentSafetyService } from './content-safety.service';
import type { AiRateLimitService } from './rate-limit.service';
import type { TemplateService } from './template.service';
import type { PromptTemplateService } from './prompt-template.service';
import { ValidationError } from './errors';
import {
  jsonInstructionHeader,
  jsonFooter,
  enumDoc,
  userContextSection,
  skillEloSection,
  characterSection,
  archetypeSection,
  roadmapContextSection,
  activeMilestoneSection,
  ledgerInsightsSection,
  rewardRulesDoc,
  rarityDistributionDoc,
  pacingConstraint,
  taskQuestTypeMapping,
  missingDataGuidance,
} from './prompt-builder';
import {
  TASK_TYPE_DOC,
  QUEST_TYPE_DOC,
  RARITY_DOC,
  BLOOM_LEVEL_DOC,
  FLOW_CATEGORY_DOC,
} from './prompt-constants';
import { buildLocaleInstruction } from './locale-utils';

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
  /** Return a task ID for L3 quest session context. Override in quest-related generators. */
  protected getTaskId(_input: TInput): string | undefined {
    return undefined;
  }

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
    protected readonly rateLimitService: AiRateLimitService,
    protected readonly templateService: TemplateService,
    protected readonly promptTemplateService?: PromptTemplateService,
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
    const taskId = this.getTaskId(input);
    const context = await this.contextService.build(userId, this.generatorType, taskId);

    // Step 1.5: Rate limit check
    await this.rateLimitService.check(userId, context.learnerProfile.subscriptionTier);

    // Step 2: Check cache (inject userId after generator-type prefix for per-user scoping)
    const rawCacheKey = this.getCacheKey(input, context);
    const cacheKey = rawCacheKey
      ? this.scopeCacheKey(rawCacheKey, context.learnerProfile.userId)
      : null;
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

    // Step 3: Build prompts — try DB template first, fall back to hardcoded
    const dbSystem = this.promptTemplateService?.getTemplate(this.generatorType, 'system');
    const dbUser = this.promptTemplateService?.getTemplate(this.generatorType, 'user');
    const systemPrompt = dbSystem
      ? this.hydrateTemplate(dbSystem, input, context)
      : this.buildSystemPrompt(context);
    const rawUserPrompt = dbUser
      ? this.hydrateTemplate(dbUser, input, context)
      : this.buildUserPrompt(input, context);

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

      // Attempt template fallback before re-throwing
      const locale = context.learnerProfile.locale;
      const templateResult = this.templateService.getFallback<TOutput>(this.generatorType, input, locale);
      if (templateResult) {
        // Validate template against output schema to catch schema drift
        const parsed = this.outputSchema.safeParse(templateResult);
        if (parsed.success) {
          this.logger.warn(`Using template fallback for ${this.generatorType}`);
          // Track as template
          this.tracer.trackSuccess({
            userId,
            generatorType: this.generatorType,
            model: 'template',
            purpose: this.generatorType,
            inputTokens: 0,
            outputTokens: 0,
            durationMs: 0,
            attempt: 0,
            cacheHit: false,
          });
          return parsed.data;
        }
        this.logger.warn(
          `Template fallback failed schema validation for ${this.generatorType}`,
        );
      }

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

  /**
   * Replace {placeholder} tokens in a DB-stored template with runtime values.
   * Unknown placeholders are replaced with empty string.
   */
  protected hydrateTemplate(
    template: string,
    _input: TInput,
    context: GeneratorContext,
  ): string {
    const { learnerProfile, domainModel } = context;

    const replacements: Record<string, string> = {
      // Headers / Footers
      '{HEADER:json}': jsonInstructionHeader(),
      '{FOOTER:json}': jsonFooter(),

      // Enum docs
      '{ENUM:taskType}': enumDoc('taskType', TASK_TYPE_DOC),
      '{ENUM:questType}': enumDoc('questType', QUEST_TYPE_DOC),
      '{ENUM:rarity}': enumDoc('rarity', RARITY_DOC),
      '{ENUM:bloomLevel}': enumDoc('bloomLevel', BLOOM_LEVEL_DOC),
      '{ENUM:flowCategory}': enumDoc('flowCategory', FLOW_CATEGORY_DOC),

      // Context sections
      '{CTX:userContext}': userContextSection(learnerProfile),
      '{CTX:skillElos}': skillEloSection(learnerProfile.skillElos),
      '{CTX:characterContext}': characterSection(learnerProfile),
      '{CTX:archetypeHints}': archetypeSection(domainModel.archetypeBlueprint),
      '{CTX:roadmapContext}': roadmapContextSection(context.roadmapContext),
      '{CTX:activeMilestone}': activeMilestoneSection(context.roadmapContext),
      '{CTX:ledgerInsights}': ledgerInsightsSection(context.ledgerContext),
      '{CTX:locale}': buildLocaleInstruction(learnerProfile.locale),

      // Rules
      '{CTX:rewardRules}': rewardRulesDoc(),
      '{CTX:rarityDistribution}': rarityDistributionDoc(),
      '{CTX:taskQuestMapping}': taskQuestTypeMapping(),
      '{CTX:missingDataGuidance}': missingDataGuidance(),
    };

    let result = template;
    for (const [token, value] of Object.entries(replacements)) {
      result = result.split(token).join(value);
    }

    return result;
  }

  /**
   * Insert userId after the generator-type prefix in a cache key.
   * e.g. "assessment:abc123" -> "assessment:userId:abc123"
   * Keys without a colon get userId prepended: "key" -> "userId:key"
   */
  private scopeCacheKey(rawKey: string, userId: string): string {
    const colonIdx = rawKey.indexOf(':');
    if (colonIdx === -1) {
      return `${userId}:${rawKey}`;
    }
    const prefix = rawKey.slice(0, colonIdx);
    const rest = rawKey.slice(colonIdx + 1);
    return `${prefix}:${userId}:${rest}`;
  }
}

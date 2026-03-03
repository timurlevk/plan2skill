import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { estimateCost } from './cost';
import type {
  ILlmTracer,
  TrackSuccessData,
  TrackFailureData,
} from './interfaces';

@Injectable()
export class LlmTracer implements ILlmTracer {
  private readonly logger = new Logger(LlmTracer.name);
  private readonly traceFull: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.traceFull = this.config.get<string>('LLM_TRACE_FULL', 'false') === 'true';
  }

  trackSuccess(data: TrackSuccessData): void {
    setImmediate(() => this.writeSuccess(data));
  }

  trackFailure(data: TrackFailureData): void {
    setImmediate(() => this.writeFailure(data));
  }

  private async writeSuccess(data: TrackSuccessData): Promise<void> {
    try {
      const costUsd = estimateCost(data.model, data.inputTokens, data.outputTokens);

      const usage = await this.prisma.llmUsage.create({
        data: {
          userId: data.userId,
          generatorType: data.generatorType,
          model: data.model,
          purpose: data.purpose,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          costUsd,
          durationMs: data.durationMs,
          success: true,
          attempt: data.attempt,
          cacheHit: data.cacheHit,
        },
      });

      if (this.traceFull) {
        await this.prisma.llmTrace.create({
          data: {
            usageId: usage.id,
            systemPrompt: data.systemPrompt ?? '',
            userPrompt: data.userPrompt ?? '',
            responseText: data.responseText,
            structuredOutput: data.structuredOutput as object ?? undefined,
          },
        });
      }
    } catch (err) {
      this.logger.warn('Failed to write LLM usage (success)', err);
    }
  }

  private async writeFailure(data: TrackFailureData): Promise<void> {
    try {
      const costUsd = estimateCost(data.model, data.inputTokens, data.outputTokens);

      const usage = await this.prisma.llmUsage.create({
        data: {
          userId: data.userId,
          generatorType: data.generatorType,
          model: data.model,
          purpose: data.purpose,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          costUsd,
          durationMs: data.durationMs,
          success: false,
          attempt: data.attempt,
          cacheHit: false,
        },
      });

      // Always trace failures
      await this.prisma.llmTrace.create({
        data: {
          usageId: usage.id,
          systemPrompt: data.systemPrompt ?? '',
          userPrompt: data.userPrompt ?? '',
          errorMessage: data.errorMessage,
        },
      });
    } catch (err) {
      this.logger.warn('Failed to write LLM usage (failure)', err);
    }
  }
}

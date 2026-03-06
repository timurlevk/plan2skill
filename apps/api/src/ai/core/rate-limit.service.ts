import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Daily AI usage limits per subscription tier */
const TIER_LIMITS: Record<string, { maxTokens: number; maxCalls: number }> = {
  free:     { maxTokens: 50_000,  maxCalls: 20  },
  pro:      { maxTokens: 200_000, maxCalls: 80  },
  champion: { maxTokens: 500_000, maxCalls: 200 },
};

const DEFAULT_LIMIT = TIER_LIMITS.free!;

export class AiRateLimitError extends Error {
  constructor(
    message: string,
    public readonly limit: number,
    public readonly current: number,
    public readonly resetsAt: Date,
  ) {
    super(message);
    this.name = 'AiRateLimitError';
  }
}

@Injectable()
export class AiRateLimitService {
  private readonly logger = new Logger(AiRateLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a user can make an AI call. Throws AiRateLimitError if limit exceeded.
   */
  async check(userId: string, subscriptionTier: string): Promise<void> {
    // System/admin calls bypass rate limits
    if (userId === 'system') return;

    const limits = TIER_LIMITS[subscriptionTier] ?? DEFAULT_LIMIT;
    const todayStart = this.getTodayStart();

    const usage = await this.prisma.llmUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true },
    });

    const totalCalls = usage._count.id;
    const totalTokens = (usage._sum.inputTokens ?? 0) + (usage._sum.outputTokens ?? 0);

    const resetsAt = new Date(todayStart);
    resetsAt.setUTCDate(resetsAt.getUTCDate() + 1);

    if (totalCalls >= limits.maxCalls) {
      throw new AiRateLimitError(
        `Daily AI call limit reached (${limits.maxCalls} calls)`,
        limits.maxCalls,
        totalCalls,
        resetsAt,
      );
    }

    if (totalTokens >= limits.maxTokens) {
      throw new AiRateLimitError(
        `Daily AI token limit reached (${limits.maxTokens} tokens)`,
        limits.maxTokens,
        totalTokens,
        resetsAt,
      );
    }
  }

  private getTodayStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}

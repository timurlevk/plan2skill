import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CostByGenerator {
  generatorType: string;
  totalCost: number;
  callCount: number;
}

interface DailyCost {
  date: string;
  cost: number;
  calls: number;
}

export interface CostSummary {
  totalCost: number;
  totalCalls: number;
  byGenerator: CostByGenerator[];
  daily: DailyCost[];
}

export interface UsageStats {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  errorRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  cacheHitRate: number;
  byGenerator: Array<{
    generatorType: string;
    calls: number;
    avgLatencyMs: number;
    errorRate: number;
    cacheHitRate: number;
  }>;
}

export interface ErrorTrace {
  id: string;
  generatorType: string;
  model: string;
  errorMessage: string;
  durationMs: number;
  createdAt: string;
  systemPrompt?: string;
  userPrompt?: string;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  byGenerator: Array<{
    generatorType: string;
    entries: number;
    totalHits: number;
  }>;
}

export interface UserCostEntry {
  userId: string;
  totalCost: number;
  callCount: number;
  avgLatencyMs: number;
}

@Injectable()
export class AdminAiService {
  constructor(private readonly prisma: PrismaService) {}

  async getCostSummary(days: number): Promise<CostSummary> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totals, byGenerator, daily] = await Promise.all([
      this.prisma.llmUsage.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true },
        _count: true,
      }),
      this.prisma.llmUsage.groupBy({
        by: ['generatorType'],
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true },
        _count: true,
        orderBy: { _sum: { costUsd: 'desc' } },
      }),
      this.prisma.$queryRaw<Array<{ date: string; cost: number; calls: bigint }>>`
        SELECT DATE(created_at) as date,
               COALESCE(SUM(cost_usd), 0)::float as cost,
               COUNT(*)::bigint as calls
        FROM llm_usage
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return {
      totalCost: totals._sum.costUsd ?? 0,
      totalCalls: totals._count,
      byGenerator: byGenerator.map((g) => ({
        generatorType: g.generatorType,
        totalCost: g._sum.costUsd ?? 0,
        callCount: g._count,
      })),
      daily: daily.map((d) => ({
        date: String(d.date),
        cost: d.cost,
        calls: Number(d.calls),
      })),
    };
  }

  async getUsageStats(days: number): Promise<UsageStats> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totals, byGenerator, latencies] = await Promise.all([
      this.prisma.llmUsage.aggregate({
        where: { createdAt: { gte: since } },
        _count: true,
        _avg: { durationMs: true },
      }),
      this.prisma.llmUsage.groupBy({
        by: ['generatorType'],
        where: { createdAt: { gte: since } },
        _count: true,
        _avg: { durationMs: true },
      }),
      this.prisma.llmUsage.findMany({
        where: { createdAt: { gte: since }, success: true },
        select: { durationMs: true },
        orderBy: { durationMs: 'asc' },
      }),
    ]);

    const successCount = await this.prisma.llmUsage.count({
      where: { createdAt: { gte: since }, success: true },
    });
    const cacheHitCount = await this.prisma.llmUsage.count({
      where: { createdAt: { gte: since }, cacheHit: true },
    });

    const failureCount = totals._count - successCount;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95LatencyMs = latencies[p95Index]?.durationMs ?? 0;

    // Per-generator stats
    const generatorStats = await Promise.all(
      byGenerator.map(async (g) => {
        const [gSuccess, gCache] = await Promise.all([
          this.prisma.llmUsage.count({
            where: { createdAt: { gte: since }, generatorType: g.generatorType, success: true },
          }),
          this.prisma.llmUsage.count({
            where: { createdAt: { gte: since }, generatorType: g.generatorType, cacheHit: true },
          }),
        ]);
        return {
          generatorType: g.generatorType,
          calls: g._count,
          avgLatencyMs: Math.round(g._avg.durationMs ?? 0),
          errorRate: g._count > 0 ? (g._count - gSuccess) / g._count : 0,
          cacheHitRate: g._count > 0 ? gCache / g._count : 0,
        };
      }),
    );

    return {
      totalCalls: totals._count,
      successCount,
      failureCount,
      errorRate: totals._count > 0 ? failureCount / totals._count : 0,
      avgLatencyMs: Math.round(totals._avg.durationMs ?? 0),
      p95LatencyMs,
      cacheHitRate: totals._count > 0 ? cacheHitCount / totals._count : 0,
      byGenerator: generatorStats,
    };
  }

  async getRecentErrors(limit: number): Promise<ErrorTrace[]> {
    const usages = await this.prisma.llmUsage.findMany({
      where: { success: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        trace: {
          select: {
            systemPrompt: true,
            userPrompt: true,
            errorMessage: true,
          },
        },
      },
    });

    return usages.map((u) => ({
      id: u.id,
      generatorType: u.generatorType,
      model: u.model,
      errorMessage: u.trace?.errorMessage ?? 'Unknown error',
      durationMs: u.durationMs,
      createdAt: u.createdAt.toISOString(),
      systemPrompt: u.trace?.systemPrompt,
      userPrompt: u.trace?.userPrompt,
    }));
  }

  async getCacheStats(): Promise<CacheStats> {
    const [totals, byGenerator] = await Promise.all([
      this.prisma.aiCache.aggregate({
        _count: true,
        _sum: { hitCount: true },
      }),
      this.prisma.aiCache.groupBy({
        by: ['generatorType'],
        _count: true,
        _sum: { hitCount: true },
      }),
    ]);

    return {
      totalEntries: totals._count,
      totalHits: totals._sum.hitCount ?? 0,
      byGenerator: byGenerator.map((g) => ({
        generatorType: g.generatorType,
        entries: g._count,
        totalHits: g._sum.hitCount ?? 0,
      })),
    };
  }

  async getTopUsersByCost(days: number, limit: number): Promise<UserCostEntry[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const results = await this.prisma.llmUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true },
      _count: true,
      _avg: { durationMs: true },
      orderBy: { _sum: { costUsd: 'desc' } },
      take: limit,
    });

    return results.map((r) => ({
      userId: r.userId,
      totalCost: r._sum.costUsd ?? 0,
      callCount: r._count,
      avgLatencyMs: Math.round(r._avg.durationMs ?? 0),
    }));
  }
}

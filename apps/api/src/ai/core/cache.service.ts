import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly prisma: PrismaService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.prisma.aiCache.findUnique({
        where: { cacheKey: key },
      });

      if (!entry) return null;

      // TTL check
      if (entry.expiresAt < new Date()) {
        // Expired — delete in background
        this.prisma.aiCache
          .delete({ where: { id: entry.id } })
          .catch(() => {});
        return null;
      }

      // Increment hit count (fire-and-forget)
      this.prisma.aiCache
        .update({
          where: { id: entry.id },
          data: { hitCount: { increment: 1 } },
        })
        .catch(() => {});

      // Probabilistic cleanup: 5% chance
      if (Math.random() < 0.05) {
        this.cleanup();
      }

      return entry.content as T;
    } catch (err) {
      this.logger.warn('Cache get failed', err);
      return null;
    }
  }

  async set<T>(
    key: string,
    generatorType: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await this.prisma.aiCache.upsert({
        where: { cacheKey: key },
        create: {
          cacheKey: key,
          generatorType,
          content: value as object,
          expiresAt,
        },
        update: {
          content: value as object,
          expiresAt,
          hitCount: 0,
        },
      });
    } catch (err) {
      this.logger.warn('Cache set failed', err);
    }
  }

  async invalidate(keyPrefix: string): Promise<void> {
    try {
      await this.prisma.aiCache.deleteMany({
        where: { cacheKey: { startsWith: keyPrefix } },
      });
    } catch (err) {
      this.logger.warn('Cache invalidate failed', err);
    }
  }

  /**
   * Event-driven cache invalidation.
   * Invalidates cached results that become stale after specific events.
   */
  async invalidateForEvent(
    userId: string,
    event: 'quest_complete' | 'roadmap_change' | 'character_change',
  ): Promise<void> {
    try {
      // Build list of generator type prefixes to invalidate (scoped to userId)
      let prefixes: string[];

      switch (event) {
        case 'quest_complete':
          prefixes = [
            `quest:${userId}:`,
            `recommendation:${userId}:`,
            `quiz:${userId}:`,
            `assessment:${userId}:`,
            `code-challenge:${userId}:`,
          ];
          break;
        case 'roadmap_change':
          prefixes = [
            `quest:${userId}:`,
            `recommendation:${userId}:`,
            `resource:${userId}:`,
            `code-challenge:${userId}:`,
            `narrative:${userId}:`,
          ];
          break;
        case 'character_change':
          prefixes = [`motivational:${userId}:`];
          break;
        default: {
          const _exhaustive: never = event;
          this.logger.warn(`Unknown cache event: ${_exhaustive}`);
          return;
        }
      }

      // Delete all matching cache entries (fire in parallel)
      await Promise.all(
        prefixes.map((prefix) =>
          this.prisma.aiCache.deleteMany({
            where: { cacheKey: { startsWith: prefix } },
          }),
        ),
      );

      this.logger.debug(
        `Cache invalidated for user "${userId}", event "${event}", prefixes: ${prefixes.join(', ')}`,
      );
    } catch (err) {
      this.logger.warn(`Cache invalidateForEvent failed: ${event}`, err);
    }
  }

  private cleanup(): void {
    this.prisma.aiCache
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .then((result) => {
        if (result.count > 0) {
          this.logger.debug(`Cache cleanup: removed ${result.count} expired entries`);
        }
      })
      .catch(() => {});
  }
}

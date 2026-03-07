import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromptTemplateService implements OnModuleInit {
  private readonly logger = new Logger(PromptTemplateService.name);
  private readonly cache = new Map<string, string>();
  private readonly metaCache = new Map<string, Record<string, unknown>>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.warmCache();
  }

  getTemplate(generatorType: string, role: 'system' | 'user'): string | null {
    return this.cache.get(`${generatorType}:${role}`) ?? null;
  }

  getMetadata(generatorType: string): Record<string, unknown> | null {
    return this.metaCache.get(generatorType) ?? null;
  }

  private async warmCache(): Promise<void> {
    try {
      const templates = await this.prisma.aiPromptTemplate.findMany({
        where: { isActive: true },
        orderBy: { version: 'desc' },
      });

      for (const t of templates) {
        const key = `${t.generatorType}:${t.promptRole}`;
        // Only store the highest-version active template per key
        if (!this.cache.has(key)) {
          this.cache.set(key, t.template);
        }
        // Store metadata from the system prompt template (highest version)
        if (t.promptRole === 'system' && !this.metaCache.has(t.generatorType) && t.metadata) {
          this.metaCache.set(t.generatorType, t.metadata as Record<string, unknown>);
        }
      }

      this.logger.log(`Warmed prompt template cache: ${this.cache.size} templates loaded`);
    } catch (err) {
      this.logger.warn(
        'Failed to warm prompt template cache — generators will use hardcoded prompts',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

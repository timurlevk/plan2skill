import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TranslationService implements OnModuleInit {
  private readonly logger = new Logger(TranslationService.name);
  // Map<locale, Map<"entityType:entityId:field", value>>
  private cache = new Map<string, Map<string, string>>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.warmCache();
  }

  async warmCache() {
    const all = await this.prisma.refTranslation.findMany();
    this.cache.clear();
    for (const row of all) {
      const key = `${row.entityType}:${row.entityId}:${row.field}`;
      if (!this.cache.has(row.locale)) {
        this.cache.set(row.locale, new Map());
      }
      this.cache.get(row.locale)!.set(key, row.value);
    }
    this.logger.log(`Loaded ${all.length} translations for ${this.cache.size} locales`);
  }

  /** Get a single translation. Falls back to 'en', then returns fallback. */
  get(entityType: string, entityId: string, field: string, locale: string, fallback?: string): string {
    const key = `${entityType}:${entityId}:${field}`;
    const localeMap = this.cache.get(locale);
    if (localeMap?.has(key)) return localeMap.get(key)!;
    // Fallback to English
    const enMap = this.cache.get('en');
    if (enMap?.has(key)) return enMap.get(key)!;
    return fallback ?? key;
  }

  /** Get all translations for a locale as a flat object (for frontend) */
  getAll(locale: string): Record<string, string> {
    const result: Record<string, string> = {};
    const localeMap = this.cache.get(locale);
    if (localeMap) {
      for (const [key, value] of localeMap) {
        result[key] = value;
      }
    }
    return result;
  }

  /** Get all UI translations for a locale (entityType='ui'), structured for next-intl */
  getUiMessages(locale: string): Record<string, string> {
    const result: Record<string, string> = {};
    const localeMap = this.cache.get(locale);
    if (localeMap) {
      for (const [key, value] of localeMap) {
        if (key.startsWith('ui:')) {
          // Convert "ui:nav.quests:label" -> "nav.quests"
          const parts = key.split(':');
          if (parts.length >= 3) {
            result[parts[1]!] = value;
          }
        }
      }
    }
    return result;
  }

  /** Upsert a translation (for admin) */
  async set(entityType: string, entityId: string, field: string, locale: string, value: string): Promise<void> {
    await this.prisma.refTranslation.upsert({
      where: {
        uq_translation: { entityType, entityId, field, locale },
      },
      update: { value },
      create: { entityType, entityId, field, locale, value },
    });
    // Update cache
    const key = `${entityType}:${entityId}:${field}`;
    if (!this.cache.has(locale)) {
      this.cache.set(locale, new Map());
    }
    this.cache.get(locale)!.set(key, value);
  }

  /** Invalidate cache and reload from DB */
  async invalidate(): Promise<void> {
    await this.warmCache();
  }
}

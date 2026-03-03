import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NarrativeGenerator } from '../ai/generators/narrative.generator';
import { ProgressionService } from '../progression/progression.service';
import type {
  NarrativeMode,
  EpisodeCardData,
  EpisodeCategory,
  NarrativePreferenceData,
  SeasonSummary,
  EpisodeReviewItem,
  SeasonStateTracker,
} from '@plan2skill/types';

// ═══════════════════════════════════════════
// NARRATIVE SERVICE — Episode CRUD, read receipts,
// preference management, AI generation pipeline
// Phase P MVP (spec §7-§14)
// ═══════════════════════════════════════════

// XP awards by episode category
const EPISODE_XP: Record<string, number> = {
  standard: 5,
  climax: 10,
  lore_drop: 5,
  character_focus: 5,
  season_finale: 25,
};

// Max narrative XP awards per day
const DAILY_NARRATIVE_XP_CAP = 5;

@Injectable()
export class NarrativeService {
  private readonly logger = new Logger(NarrativeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly narrativeGenerator: NarrativeGenerator,
    private readonly progressionService: ProgressionService,
  ) {}

  // ─── Today's Episode ─────────────────────────────────────────

  async getTodayEpisode(userId: string): Promise<EpisodeCardData | null> {
    // Check user preference
    const pref = await this.getOrCreatePreference(userId);
    if (pref.narrativeMode === 'off') return null;

    // Get the latest published episode
    const episode = await this.prisma.episode.findFirst({
      where: {
        status: 'published',
        publishedAt: { not: null },
      },
      orderBy: { globalNumber: 'desc' },
      include: {
        season: { select: { title: true, seasonNumber: true } },
        readReceipts: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!episode) return null;

    const receipt = episode.readReceipts[0];

    return {
      id: episode.id,
      episodeNumber: episode.episodeNumber,
      globalNumber: episode.globalNumber,
      title: episode.title,
      contextSentence: episode.contextSentence,
      body: episode.body,
      cliffhanger: episode.cliffhanger,
      sageReflection: episode.sageReflection,
      illustrationUrl: episode.illustrationUrl,
      category: episode.category as EpisodeCategory,
      readTimeSeconds: episode.readTimeSeconds,
      seasonTitle: episode.season.title,
      seasonNumber: episode.season.seasonNumber,
      isRead: !!receipt && !receipt.dismissed,
      isDismissed: !!receipt?.dismissed,
    };
  }

  // ─── Mark Episode Read ────────────────────────────────────────

  async markEpisodeRead(
    userId: string,
    episodeId: string,
    source: string,
    durationSec?: number,
  ): Promise<{ xpAwarded: number; alreadyRead: boolean }> {
    // Check if already read (no double XP)
    const existing = await this.prisma.episodeReadReceipt.findUnique({
      where: { uq_user_episode: { userId, episodeId } },
    });

    if (existing) {
      return { xpAwarded: 0, alreadyRead: true };
    }

    // Check daily narrative XP cap
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.episodeReadReceipt.count({
      where: {
        userId,
        dismissed: false,
        readAt: { gte: todayStart },
      },
    });

    if (todayCount >= DAILY_NARRATIVE_XP_CAP) {
      // Still create receipt but no XP
      await this.prisma.episodeReadReceipt.create({
        data: {
          userId,
          episodeId,
          readDurationSec: durationSec,
          xpAwarded: 0,
          source,
        },
      });
      return { xpAwarded: 0, alreadyRead: false };
    }

    // Get episode category for XP calculation
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { category: true, globalNumber: true },
    });

    const xpAmount = EPISODE_XP[episode?.category || 'standard'] || 5;

    // Create receipt + award XP
    await this.prisma.episodeReadReceipt.create({
      data: {
        userId,
        episodeId,
        readDurationSec: durationSec,
        xpAwarded: xpAmount,
        source,
      },
    });

    // Award XP via progression service (optimistic locking via UPDATE...RETURNING)
    await this.progressionService.awardXp(userId, xpAmount, 'narrative_read' as any, 1.0, {
      episodeId,
      source,
    });

    // Update last read episode in preferences
    if (episode?.globalNumber) {
      await this.prisma.narrativePreference.upsert({
        where: { userId },
        create: { userId, lastReadEpisode: episode.globalNumber },
        update: { lastReadEpisode: episode.globalNumber },
      });
    }

    return { xpAwarded: xpAmount, alreadyRead: false };
  }

  // ─── Dismiss Episode ──────────────────────────────────────────

  async dismissEpisode(userId: string, episodeId: string): Promise<{ dismissed: boolean }> {
    const existing = await this.prisma.episodeReadReceipt.findUnique({
      where: { uq_user_episode: { userId, episodeId } },
    });

    if (existing) {
      // Update to dismissed
      await this.prisma.episodeReadReceipt.update({
        where: { id: existing.id },
        data: { dismissed: true },
      });
    } else {
      // Create dismissed receipt — no XP, no guilt
      await this.prisma.episodeReadReceipt.create({
        data: {
          userId,
          episodeId,
          xpAwarded: 0,
          dismissed: true,
          source: 'home',
        },
      });
    }

    return { dismissed: true };
  }

  // ─── Preferences ──────────────────────────────────────────────

  async getNarrativePreference(userId: string): Promise<NarrativePreferenceData> {
    const pref = await this.getOrCreatePreference(userId);
    return {
      narrativeMode: pref.narrativeMode as NarrativeMode,
      lastReadEpisode: pref.lastReadEpisode,
      onboardingLegendCompleted: pref.onboardingLegendCompleted,
    };
  }

  async setNarrativeMode(userId: string, mode: NarrativeMode): Promise<NarrativePreferenceData> {
    const pref = await this.prisma.narrativePreference.upsert({
      where: { userId },
      create: { userId, narrativeMode: mode },
      update: { narrativeMode: mode },
    });
    return {
      narrativeMode: pref.narrativeMode as NarrativeMode,
      lastReadEpisode: pref.lastReadEpisode,
      onboardingLegendCompleted: pref.onboardingLegendCompleted,
    };
  }

  // ─── Seasons & Episodes (Archive) ─────────────────────────────

  async getSeasons(): Promise<SeasonSummary[]> {
    const seasons = await this.prisma.season.findMany({
      where: { status: { in: ['active', 'completed'] } },
      orderBy: { seasonNumber: 'asc' },
      include: {
        _count: { select: { episodes: { where: { status: 'published' } } } },
      },
    });

    return seasons.map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      description: s.description,
      status: s.status,
      episodeCount: s._count.episodes,
    }));
  }

  async getSeasonEpisodes(
    seasonId: string,
    userId: string,
  ): Promise<EpisodeCardData[]> {
    const episodes = await this.prisma.episode.findMany({
      where: { seasonId, status: 'published' },
      orderBy: { episodeNumber: 'asc' },
      include: {
        season: { select: { title: true, seasonNumber: true } },
        readReceipts: {
          where: { userId },
          take: 1,
        },
      },
    });

    return episodes.map((ep) => {
      const receipt = ep.readReceipts[0];
      return {
        id: ep.id,
        episodeNumber: ep.episodeNumber,
        globalNumber: ep.globalNumber,
        title: ep.title,
        contextSentence: ep.contextSentence,
        body: ep.body,
        cliffhanger: ep.cliffhanger,
        sageReflection: ep.sageReflection,
        illustrationUrl: ep.illustrationUrl,
        category: ep.category as EpisodeCategory,
        readTimeSeconds: ep.readTimeSeconds,
        seasonTitle: ep.season.title,
        seasonNumber: ep.season.seasonNumber,
        isRead: !!receipt && !receipt.dismissed,
        isDismissed: !!receipt?.dismissed,
      };
    });
  }

  // ─── Onboarding Legend ────────────────────────────────────────

  async completeLegend(userId: string): Promise<{ xpAwarded: number }> {
    await this.prisma.narrativePreference.upsert({
      where: { userId },
      create: { userId, onboardingLegendCompleted: true },
      update: { onboardingLegendCompleted: true },
    });

    // Award +15 XP for completing the legend
    await this.progressionService.awardXp(userId, 15, 'legend_complete' as any, 1.0, {});

    return { xpAwarded: 15 };
  }

  // ─── AI Episode Generation (Admin) ────────────────────────────

  async generateEpisodeBatch(
    seasonId: string,
    count: number,
  ): Promise<{ generated: number; episodeIds: string[] }> {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        storyBible: true,
        episodes: {
          orderBy: { episodeNumber: 'desc' },
          take: 20,
          select: { episodeNumber: true, globalNumber: true, summary: true, act: true },
        },
      },
    });

    if (!season) throw new Error('Season not found');

    const lastEpisode = season.episodes[0];
    const nextEpisodeNum = (lastEpisode?.episodeNumber || 0) + 1;
    const nextGlobalNum = (lastEpisode?.globalNumber || 0) + 1;

    const stateTracker = season.stateTracker as unknown as SeasonStateTracker;
    const recentSummaries = season.episodes
      .map((e) => ({ episodeNumber: e.episodeNumber, summary: e.summary }))
      .reverse();

    const episodeIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const episodeNum = nextEpisodeNum + i;
      const globalNum = nextGlobalNum + i;

      try {
        const result = await this.narrativeGenerator.generate('system', {
          seasonId,
          seasonTitle: season.title,
          episodeNumber: episodeNum,
          globalNumber: globalNum,
          recentSummaries,
          stateTracker,
          storyBible: {
            worldName: season.storyBible.worldName,
            worldRules: season.storyBible.worldRules,
            characters: season.storyBible.characters,
            geography: season.storyBible.geography,
          },
          arcOutline: season.arcOutline,
        });

        // Post-validation word count quality gate
        const wordCount = result.body.split(/\s+/).length;
        if (wordCount < 80 || wordCount > 250) {
          this.logger.warn(`Episode ${episodeNum}: word count ${wordCount} outside 80-250 range, skipping`);
          continue;
        }

        const readTimeSeconds = Math.ceil(wordCount / 3.5);

        const episode = await this.prisma.episode.create({
          data: {
            seasonId,
            episodeNumber: episodeNum,
            globalNumber: globalNum,
            title: result.title,
            contextSentence: result.contextSentence,
            body: result.body,
            cliffhanger: result.cliffhanger,
            sageReflection: result.sageReflection,
            summary: result.summary,
            category: result.category,
            toneProfile: result.tone,
            wordCount,
            readTimeSeconds,
            act: result.act,
            status: 'draft',
            aiModelUsed: 'claude-sonnet-4-6',
            aiConfidence: 0.85,
          },
        });

        episodeIds.push(episode.id);
      } catch (err) {
        this.logger.error(`Episode ${episodeNum} generation failed: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }
    }

    return { generated: episodeIds.length, episodeIds };
  }

  // ─── Episode Review (Admin) ───────────────────────────────────

  async getReviewQueue(): Promise<EpisodeReviewItem[]> {
    const episodes = await this.prisma.episode.findMany({
      where: { status: { in: ['draft', 'reviewed'] } },
      orderBy: [{ status: 'asc' }, { globalNumber: 'asc' }],
    });

    return episodes.map((ep) => ({
      id: ep.id,
      episodeNumber: ep.episodeNumber,
      globalNumber: ep.globalNumber,
      title: ep.title,
      body: ep.body,
      sageReflection: ep.sageReflection,
      category: ep.category as EpisodeCategory,
      wordCount: ep.wordCount,
      status: ep.status as any,
      aiModelUsed: ep.aiModelUsed,
      aiConfidence: ep.aiConfidence,
      createdAt: ep.createdAt.toISOString(),
    }));
  }

  async reviewEpisode(
    episodeId: string,
    action: 'approve' | 'reject',
    edits?: { title?: string; body?: string; sageReflection?: string },
  ): Promise<{ status: string }> {
    if (action === 'approve') {
      const updateData: Record<string, any> = {
        status: 'reviewed',
        humanReviewedAt: new Date(),
      };

      if (edits?.title) updateData.title = edits.title;
      if (edits?.body) {
        updateData.body = edits.body;
        updateData.wordCount = edits.body.split(/\s+/).length;
      }
      if (edits?.sageReflection) updateData.sageReflection = edits.sageReflection;

      await this.prisma.episode.update({
        where: { id: episodeId },
        data: updateData,
      });

      return { status: 'reviewed' };
    }

    // Reject — mark as archived
    await this.prisma.episode.update({
      where: { id: episodeId },
      data: { status: 'archived', humanReviewedAt: new Date() },
    });

    return { status: 'archived' };
  }

  // ─── Internal Helpers ─────────────────────────────────────────

  private async getOrCreatePreference(userId: string) {
    return this.prisma.narrativePreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }
}

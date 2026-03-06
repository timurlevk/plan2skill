import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Tier Limits ────────────────────────────────────────────────

interface TierLimits {
  dailyHints: number;
  dailyTutor: number;
  dailyExplains: number;
  hintCoinCost: number;
  tutorCoinCost: number;
  explainCoinCost: number;
  crystalCostPerQuest: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    dailyHints: 1,
    dailyTutor: 0,
    dailyExplains: 0,
    hintCoinCost: 2,
    tutorCoinCost: 5,
    explainCoinCost: 3,
    crystalCostPerQuest: 1,
  },
  pro: {
    dailyHints: 10,
    dailyTutor: 3,
    dailyExplains: 5,
    hintCoinCost: 0,
    tutorCoinCost: 2,
    explainCoinCost: 0,
    crystalCostPerQuest: 1,
  },
  champion: {
    dailyHints: Infinity,
    dailyTutor: Infinity,
    dailyExplains: Infinity,
    hintCoinCost: 0,
    tutorCoinCost: 0,
    explainCoinCost: 0,
    crystalCostPerQuest: 0,
  },
};

function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier.toLowerCase()] ?? TIER_LIMITS.free!;
}

// ─── Public Types ───────────────────────────────────────────────

export type AiFeature = 'hint' | 'tutor' | 'explain';

export interface ContentBalance {
  crystals: number;
  maxCrystals: number;
  coins: number;
  subscriptionTier: string;
  aiHintsToday: number;
  aiTutorToday: number;
  aiExplainsToday: number;
  limits: TierLimits;
}

export interface SpendResult {
  ok: boolean;
  remaining: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  coinCost: number;
}

// ─── Service ────────────────────────────────────────────────────

@Injectable()
export class ContentBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  /** Deduct 1 crystal for quest attempt. Returns false if insufficient. */
  async spendCrystal(userId: string): Promise<SpendResult> {
    const prog = await this.ensureResetAndGet(userId);
    if (!prog) return { ok: false, remaining: 0 };

    const limits = getTierLimits(prog.subscriptionTier);
    if (limits.crystalCostPerQuest === 0) {
      return { ok: true, remaining: prog.energyCrystals };
    }

    if (prog.energyCrystals < limits.crystalCostPerQuest) {
      return { ok: false, remaining: prog.energyCrystals };
    }

    const updated = await this.prisma.userProgression.update({
      where: { userId },
      data: { energyCrystals: { decrement: limits.crystalCostPerQuest } },
      select: { energyCrystals: true },
    });

    return { ok: true, remaining: updated.energyCrystals };
  }

  /** Deduct coins. Returns false if insufficient. */
  async spendCoins(userId: string, amount: number): Promise<SpendResult> {
    const prog = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { coins: true },
    });
    if (!prog || prog.coins < amount) {
      return { ok: false, remaining: prog?.coins ?? 0 };
    }

    const updated = await this.prisma.userProgression.update({
      where: { userId },
      data: { coins: { decrement: amount } },
      select: { coins: true },
    });

    return { ok: true, remaining: updated.coins };
  }

  /** Check if an AI feature is available (quota + coin cost). */
  async checkAiQuota(
    userId: string,
    feature: AiFeature,
  ): Promise<QuotaCheckResult> {
    const prog = await this.ensureResetAndGet(userId);
    if (!prog) return { allowed: false, remaining: 0, coinCost: 0 };

    const limits = getTierLimits(prog.subscriptionTier);

    switch (feature) {
      case 'hint': {
        const remaining = Math.max(0, limits.dailyHints - prog.aiHintsToday);
        if (remaining > 0) {
          return { allowed: true, remaining, coinCost: 0 };
        }
        // Over daily limit — can still use with coins
        return {
          allowed: prog.coins >= limits.hintCoinCost,
          remaining: 0,
          coinCost: limits.hintCoinCost,
        };
      }
      case 'tutor': {
        const remaining = Math.max(0, limits.dailyTutor - prog.aiTutorToday);
        if (remaining > 0) {
          return { allowed: true, remaining, coinCost: 0 };
        }
        return {
          allowed: prog.coins >= limits.tutorCoinCost,
          remaining: 0,
          coinCost: limits.tutorCoinCost,
        };
      }
      case 'explain': {
        const remaining = Math.max(0, limits.dailyExplains - prog.aiExplainsToday);
        if (remaining > 0) {
          return { allowed: true, remaining, coinCost: 0 };
        }
        return {
          allowed: prog.coins >= limits.explainCoinCost,
          remaining: 0,
          coinCost: limits.explainCoinCost,
        };
      }
    }
  }

  /** Increment daily AI usage counter after a successful AI assist. */
  async incrementAiUsage(userId: string, feature: AiFeature): Promise<void> {
    const field = feature === 'hint' ? 'aiHintsToday'
      : feature === 'tutor' ? 'aiTutorToday'
      : 'aiExplainsToday';
    await this.prisma.userProgression.update({
      where: { userId },
      data: { [field]: { increment: 1 } },
    });
  }

  /** Reset daily quotas if the date has changed. */
  async resetDailyQuotas(userId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.prisma.userProgression.update({
      where: { userId },
      data: {
        aiHintsToday: 0,
        aiTutorToday: 0,
        aiExplainsToday: 0,
        lastResetDate: today,
      },
    });
  }

  /** Get full balance for a user. */
  async getBalance(userId: string): Promise<ContentBalance> {
    const prog = await this.ensureResetAndGet(userId);
    if (!prog) {
      const defaultLimits = getTierLimits('free');
      return {
        crystals: 0,
        maxCrystals: 3,
        coins: 0,
        subscriptionTier: 'free',
        aiHintsToday: 0,
        aiTutorToday: 0,
        aiExplainsToday: 0,
        limits: defaultLimits,
      };
    }

    return {
      crystals: prog.energyCrystals,
      maxCrystals: prog.maxEnergyCrystals,
      coins: prog.coins,
      subscriptionTier: prog.subscriptionTier,
      aiHintsToday: prog.aiHintsToday,
      aiTutorToday: prog.aiTutorToday,
      aiExplainsToday: prog.aiExplainsToday,
      limits: getTierLimits(prog.subscriptionTier),
    };
  }

  // ─── Internal ─────────────────────────────────────────────────

  /** Get progression, auto-resetting daily quotas if date changed. */
  private async ensureResetAndGet(userId: string) {
    const prog = await this.prisma.userProgression.findUnique({
      where: { userId },
    });
    if (!prog) return null;

    const today = new Date().toISOString().slice(0, 10);
    if (prog.lastResetDate !== today) {
      return this.prisma.userProgression.update({
        where: { userId },
        data: {
          aiHintsToday: 0,
          aiTutorToday: 0,
          aiExplainsToday: 0,
          lastResetDate: today,
        },
      });
    }

    return prog;
  }
}

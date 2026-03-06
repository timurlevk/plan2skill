import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Bot filler names for leagues with <15 members
const BOT_NAMES = [
  'NovaStar', 'ByteKnight', 'PixelWiz', 'CodeFox', 'QuestRunner',
  'SkyLearner', 'DataDruid', 'RuneMaster', 'VoidWalker', 'FlameSeeker',
  'IronSage', 'LunarHex', 'TechShaman', 'CrystalMind', 'DawnBlade',
  'EchoForge', 'GlitchHero', 'NeonDrift', 'PhantomLink', 'StormCraft',
];

const BOT_CHARS = ['aria', 'kofi', 'mei', 'diego', 'zara', 'alex', 'priya', 'liam'];

function tierForLevel(level: number): string {
  if (level <= 5) return 'bronze';
  if (level <= 10) return 'silver';
  if (level <= 15) return 'gold';
  if (level <= 25) return 'diamond';
  return 'master';
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'master'];

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff,
    0, 0, 0, 0,
  ));
  return monday;
}

@Injectable()
export class LeagueService {
  private readonly logger = new Logger(LeagueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get or create user's weekly league (lazy reset) */
  async getOrCreateWeeklyLeague(userId: string) {
    const weekStart = getWeekStart();

    // Check if user already has a membership this week
    const existing = await this.prisma.leagueMember.findFirst({
      where: {
        userId,
        league: { weekStart },
      },
      include: { league: true },
    });

    if (existing) {
      return this.getLeaderboard(existing.leagueId, userId);
    }

    // Determine tier from user level
    const progression = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { level: true },
    });
    const level = progression?.level ?? 1;

    // Check last week's result for promotion/demotion
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastMembership = await this.prisma.leagueMember.findFirst({
      where: {
        userId,
        league: { weekStart: lastWeekStart },
      },
      include: { league: { include: { members: { orderBy: { weeklyXp: 'desc' } } } } },
    });

    let tier = tierForLevel(level);

    if (lastMembership) {
      const members = lastMembership.league.members;
      const userRank = members.findIndex((m) => m.userId === userId) + 1;
      const totalMembers = members.length;
      const lastTier = lastMembership.league.tier;
      const tierIdx = TIER_ORDER.indexOf(lastTier);

      if (userRank <= 5 && tierIdx < TIER_ORDER.length - 1) {
        // Promote
        tier = TIER_ORDER[tierIdx + 1]!;
      } else if (userRank > totalMembers - 5 && tierIdx > 0) {
        // Demote
        tier = TIER_ORDER[tierIdx - 1]!;
      } else {
        tier = lastTier;
      }
    }

    // Find or create league for this tier + week
    const league = await this.prisma.league.upsert({
      where: { tier_weekStart: { tier, weekStart } },
      create: { tier, weekStart },
      update: {},
    });

    // Add user as member
    await this.prisma.leagueMember.upsert({
      where: { leagueId_userId: { leagueId: league.id, userId } },
      create: { leagueId: league.id, userId, weeklyXp: 0 },
      update: {},
    });

    return this.getLeaderboard(league.id, userId);
  }

  /** Get leaderboard (top 30 + bot fillers if needed) */
  async getLeaderboard(leagueId: string, currentUserId: string) {
    const members = await this.prisma.leagueMember.findMany({
      where: { leagueId },
      orderBy: { weeklyXp: 'desc' },
      take: 30,
      include: {
        user: {
          select: {
            id: true, displayName: true,
            character: { select: { characterId: true } },
          },
        },
      },
    });

    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      select: { tier: true },
    });

    const realMembers = members.map((m, i) => ({
      name: m.user.displayName,
      xp: m.weeklyXp,
      charId: m.user.character?.characterId ?? 'aria',
      rank: i + 1,
      isYou: m.userId === currentUserId,
      isBot: false,
    }));

    // Bot fillers if <15 real members
    const minMembers = 15;
    if (realMembers.length < minMembers) {
      const needed = minMembers - realMembers.length;
      const maxRealXp = realMembers[0]?.xp ?? 100;
      const minRealXp = realMembers[realMembers.length - 1]?.xp ?? 0;

      const usedNames = new Set(realMembers.map((m) => m.name));
      const availableNames = BOT_NAMES.filter((n) => !usedNames.has(n));

      for (let i = 0; i < needed && i < availableNames.length; i++) {
        const xp = Math.max(
          0,
          Math.floor(minRealXp + Math.random() * (maxRealXp - minRealXp) * 0.8),
        );
        realMembers.push({
          name: availableNames[i]!,
          xp,
          charId: BOT_CHARS[Math.floor(Math.random() * BOT_CHARS.length)]!,
          rank: 0,
          isYou: false,
          isBot: true,
        });
      }

      // Re-sort and re-rank
      realMembers.sort((a, b) => b.xp - a.xp);
      realMembers.forEach((m, i) => { m.rank = i + 1; });
    }

    return {
      tier: league?.tier ?? 'bronze',
      leaderboard: realMembers,
    };
  }

  /** Increment weekly XP for a user's current league membership */
  async addWeeklyXp(userId: string, xp: number) {
    const weekStart = getWeekStart();

    const membership = await this.prisma.leagueMember.findFirst({
      where: {
        userId,
        league: { weekStart },
      },
    });

    if (!membership) return; // user not in a league this week

    await this.prisma.leagueMember.update({
      where: { id: membership.id },
      data: { weeklyXp: { increment: xp } },
    });
  }

  /** Get user's current league info */
  async getMyLeagueInfo(userId: string) {
    const weekStart = getWeekStart();

    const membership = await this.prisma.leagueMember.findFirst({
      where: {
        userId,
        league: { weekStart },
      },
      include: {
        league: {
          select: {
            id: true,
            tier: true,
            members: { orderBy: { weeklyXp: 'desc' }, select: { userId: true } },
          },
        },
      },
    });

    if (!membership) {
      return { tier: 'bronze', rank: 0, weeklyXp: 0, leagueId: null };
    }

    const rank = membership.league.members.findIndex((m) => m.userId === userId) + 1;

    return {
      tier: membership.league.tier,
      rank,
      weeklyXp: membership.weeklyXp,
      leagueId: membership.league.id,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BOSS_NAMES = [
  'Procrastination Dragon', 'Doubt Specter', 'Burnout Phoenix',
  'Distraction Hydra', 'Imposter Wraith', 'Overthinking Golem',
  'Perfectionism Titan', 'Scope Creep Serpent', 'Analysis Paralysis',
  'Comfort Zone Guardian',
];

const RARITY_HP: Record<string, number> = {
  common: 500,
  rare: 800,
  epic: 1200,
  legendary: 2000,
};

const RARITY_REWARDS: Record<string, { xp: number; crystals: number }> = {
  common: { xp: 100, crystals: 3 },
  rare: { xp: 150, crystals: 4 },
  epic: { xp: 200, crystals: 5 },
  legendary: { xp: 300, crystals: 7 },
};

const RARITIES = ['common', 'common', 'rare', 'rare', 'epic', 'legendary'];

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff,
    0, 0, 0, 0,
  ));
}

function randomBoss() {
  const name = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)]!;
  const bossRarity = RARITIES[Math.floor(Math.random() * RARITIES.length)]!;
  const maxHp = RARITY_HP[bossRarity]!;
  const rewards = RARITY_REWARDS[bossRarity]!;
  return { name, bossRarity, maxHp, ...rewards };
}

@Injectable()
export class PartyQuestService {
  private readonly logger = new Logger(PartyQuestService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get active party quest the user is a member of */
  async getActivePartyQuest(userId: string) {
    const membership = await this.prisma.partyMember.findFirst({
      where: {
        userId,
        partyQuest: { status: 'active' },
      },
      include: {
        partyQuest: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    displayName: true,
                    character: { select: { characterId: true } },
                  },
                },
              },
              orderBy: { totalDamage: 'desc' },
            },
          },
        },
      },
    });

    if (!membership) return null;

    const quest = membership.partyQuest;
    return {
      id: quest.id,
      name: quest.bossName,
      rarity: quest.bossRarity,
      hp: quest.currentHp,
      maxHp: quest.maxHp,
      reward: { xp: quest.rewardXp, crystals: quest.rewardCrystals },
      members: quest.members.map((m) => ({
        name: m.user.displayName,
        charId: m.user.character?.characterId ?? 'aria',
        dmg: m.totalDamage,
        isYou: m.userId === userId,
      })),
    };
  }

  /** Join an existing party quest or create a new one */
  async joinOrCreatePartyQuest(userId: string) {
    // Check if already in an active quest
    const existing = await this.getActivePartyQuest(userId);
    if (existing) return existing;

    const weekStart = getWeekStart();

    // Find an active quest with <5 members
    const openQuest = await this.prisma.partyQuest.findFirst({
      where: {
        status: 'active',
        weekStart,
        members: { none: { userId } }, // not already a member
      },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'asc' },
    });

    let questId: string;

    if (openQuest && openQuest._count.members < 5) {
      questId = openQuest.id;
    } else {
      // Create new quest
      const boss = randomBoss();
      const newQuest = await this.prisma.partyQuest.create({
        data: {
          bossName: boss.name,
          bossRarity: boss.bossRarity,
          maxHp: boss.maxHp,
          currentHp: boss.maxHp,
          rewardXp: boss.xp,
          rewardCrystals: boss.crystals,
          weekStart,
          status: 'active',
        },
      });
      questId = newQuest.id;
    }

    // Join
    await this.prisma.partyMember.create({
      data: { partyQuestId: questId, userId },
    });

    return this.getActivePartyQuest(userId);
  }

  /** Deal damage to the party quest boss (called as side-effect of completing tasks) */
  async dealDamage(userId: string, damage: number) {
    const membership = await this.prisma.partyMember.findFirst({
      where: {
        userId,
        partyQuest: { status: 'active' },
      },
      include: { partyQuest: true },
    });

    if (!membership) return;

    // Update member damage
    await this.prisma.partyMember.update({
      where: { id: membership.id },
      data: { totalDamage: { increment: damage } },
    });

    // Decrement boss HP
    const newHp = Math.max(0, membership.partyQuest.currentHp - damage);
    await this.prisma.partyQuest.update({
      where: { id: membership.partyQuestId },
      data: { currentHp: newHp },
    });

    // Check if boss defeated
    if (newHp <= 0) {
      await this.prisma.partyQuest.update({
        where: { id: membership.partyQuestId },
        data: { status: 'defeated' },
      });

      // Award rewards to all party members
      const members = await this.prisma.partyMember.findMany({
        where: { partyQuestId: membership.partyQuestId },
        select: { userId: true },
      });

      const quest = membership.partyQuest;
      for (const m of members) {
        // Award XP
        await this.prisma.xPEvent.create({
          data: {
            userId: m.userId,
            amount: quest.rewardXp,
            source: 'party_quest',
          },
        });
        await this.prisma.userProgression.update({
          where: { userId: m.userId },
          data: { totalXp: { increment: quest.rewardXp } },
        });
        // Award crystals
        await this.prisma.userProgression.update({
          where: { userId: m.userId },
          data: {
            energyCrystals: {
              increment: quest.rewardCrystals,
            },
          },
        });
      }
    }
  }

  /** Get completed party quests this week */
  async getWeeklyPartyHistory(userId: string) {
    const weekStart = getWeekStart();

    const quests = await this.prisma.partyQuest.findMany({
      where: {
        status: 'defeated',
        weekStart: { gte: weekStart },
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quests.map((q) => ({
      id: q.id,
      bossName: q.bossName,
      bossRarity: q.bossRarity,
      rewardXp: q.rewardXp,
      rewardCrystals: q.rewardCrystals,
      memberCount: q.members.length,
      yourDamage: q.members.find((m) => m.userId === userId)?.totalDamage ?? 0,
    }));
  }
}

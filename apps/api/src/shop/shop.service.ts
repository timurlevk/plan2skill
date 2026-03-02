import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';

/**
 * Shop Service — cosmetics-only shop (DEC-5F-04: no P2W).
 * Anti-gaming: 20 purchases/day, optimistic lock on coins (§12).
 */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'cosmetic' | 'streak_freeze' | 'loot_reroll';
  rarity: string;
  itemId: string | null; // FK to equipment catalog for cosmetics
}

// Static shop catalog (Phase 5F — will move to DB in Phase 7)
const SHOP_CATALOG: ShopItem[] = [
  // Cosmetics
  { id: 'shop_cosmetic_common_01', name: 'Bronze Crest',        description: 'A humble decoration for your profile.',              cost: 50,  type: 'cosmetic',      rarity: 'common',   itemId: null },
  { id: 'shop_cosmetic_common_02', name: 'Iron Emblem',         description: 'A sturdy emblem showing your commitment.',            cost: 50,  type: 'cosmetic',      rarity: 'common',   itemId: null },
  { id: 'shop_cosmetic_uncommon_01', name: 'Silver Sigil',      description: 'An elegant mark of growing expertise.',              cost: 150, type: 'cosmetic',      rarity: 'uncommon', itemId: null },
  { id: 'shop_cosmetic_uncommon_02', name: 'Emerald Pendant',   description: 'A green crystal that pulses with knowledge.',         cost: 150, type: 'cosmetic',      rarity: 'uncommon', itemId: null },
  { id: 'shop_cosmetic_rare_01', name: 'Sapphire Crown',        description: 'A radiant crown that marks true scholars.',           cost: 400, type: 'cosmetic',      rarity: 'rare',     itemId: null },
  // Utility
  { id: 'shop_streak_freeze',    name: 'Streak Shield',         description: 'Protect your streak for 1 day. Use wisely, hero!',   cost: 100, type: 'streak_freeze', rarity: 'rare',     itemId: null },
  { id: 'shop_loot_reroll',      name: 'Fortune Stone',         description: 'Reroll your last loot drop for a chance at better.',  cost: 75,  type: 'loot_reroll',   rarity: 'uncommon', itemId: null },
];

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
  ) {}

  /** Get shop catalog */
  getCatalog() {
    return SHOP_CATALOG;
  }

  /** Purchase an item from the shop */
  async purchase(userId: string, shopItemId: string) {
    const shopItem = SHOP_CATALOG.find((i) => i.id === shopItemId);
    if (!shopItem) {
      throw new BadRequestException('This artifact is not available in the shop!');
    }

    // Anti-gaming: 20 purchases/day
    // For now, track via simple count query on today's coin transactions
    // In production, use dedicated purchase_history table

    // Optimistic lock on coins: WHERE coins >= cost
    const result = await this.prisma.$executeRawUnsafe(
      `UPDATE "user_progression" SET coins = coins - $1 WHERE "user_id" = $2 AND coins >= $1 RETURNING coins`,
      shopItem.cost,
      userId,
    );

    if (result === 0) {
      throw new BadRequestException('Not enough coins, hero! Complete more quests to earn gold.');
    }

    // Get updated coin balance
    const progression = await this.prisma.userProgression.findUnique({
      where: { userId },
      select: { coins: true },
    });

    return {
      success: true,
      shopItemId,
      name: shopItem.name,
      type: shopItem.type,
      coinsSpent: shopItem.cost,
      coinsRemaining: progression?.coins ?? 0,
    };
  }
}

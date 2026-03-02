import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * Forge Service — 3→1 same-rarity merge (DEC-5F-02).
 * Anti-gaming: 30s cooldown, 10/day cap (§12).
 */
@Injectable()
export class ForgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
  ) {}

  /**
   * Forge 3 items of the same rarity into 1 item of next tier.
   * @param userId
   * @param itemIds — exactly 3 itemIds (from inventory)
   */
  async forge(userId: string, itemIds: [string, string, string]) {
    if (itemIds.length !== 3) {
      throw new BadRequestException('The forge requires exactly 3 artifacts, hero!');
    }

    // Anti-gaming: daily cap (10/day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayForges = await this.prisma.forgeHistory.count({
      where: { userId, forgedAt: { gte: startOfDay } },
    });
    if (todayForges >= 10) {
      throw new BadRequestException('The forge needs to cool down. Return tomorrow, hero!');
    }

    // Anti-gaming: 30s cooldown
    const lastForge = await this.prisma.forgeHistory.findFirst({
      where: { userId },
      orderBy: { forgedAt: 'desc' },
    });
    if (lastForge) {
      const secondsSince = (Date.now() - lastForge.forgedAt.getTime()) / 1000;
      if (secondsSince < 30) {
        throw new BadRequestException('The forge is still hot! Wait a moment, hero.');
      }
    }

    // Validate all items exist in inventory with quantity >= 1
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { userId, itemId: { in: itemIds } },
    });

    if (inventoryItems.length !== 3) {
      throw new BadRequestException('You do not own all of these items, hero!');
    }

    // Check each has sufficient quantity (handle duplicates)
    const quantityNeeded: Record<string, number> = {};
    for (const id of itemIds) {
      quantityNeeded[id] = (quantityNeeded[id] ?? 0) + 1;
    }
    for (const [id, needed] of Object.entries(quantityNeeded)) {
      const inv = inventoryItems.find((i) => i.itemId === id);
      if (!inv || inv.quantity < needed) {
        throw new BadRequestException('Not enough of this item in your inventory, hero!');
      }
    }

    // Validate all same rarity
    const rarities = new Set(inventoryItems.map((i) => i.rarity));
    if (rarities.size !== 1) {
      throw new BadRequestException('All items must be the same rarity, hero!');
    }

    const inputRarity = inventoryItems[0]!.rarity;
    const rarityIdx = RARITY_ORDER.indexOf(inputRarity);

    // EC-04: Cannot forge legendary
    if (inputRarity === 'legendary' || rarityIdx >= RARITY_ORDER.length - 1) {
      throw new BadRequestException('Legendary items have reached their pinnacle!');
    }

    const outputRarity = RARITY_ORDER[rarityIdx + 1]!;

    // Find a random catalog item of the output rarity
    const candidates = await this.prisma.equipmentCatalog.findMany({
      where: { rarity: outputRarity, isActive: true, validTo: null },
    });

    if (candidates.length === 0) {
      throw new BadRequestException('The forge produced nothing. Try again later!');
    }

    const outputCatalog = candidates[Math.floor(Math.random() * candidates.length)]!;

    // Transaction: consume inputs, create output, write history
    await this.prisma.$transaction(async (tx) => {
      // Consume input items (decrement quantity)
      for (const [id, needed] of Object.entries(quantityNeeded)) {
        await tx.inventoryItem.update({
          where: { uq_inventory_user_item: { userId, itemId: id } },
          data: { quantity: { decrement: needed } },
        });
      }

      // Clean up zero-quantity inventory items
      await tx.inventoryItem.deleteMany({
        where: { userId, quantity: { lte: 0 } },
      });

      // Add output to inventory
      await tx.inventoryItem.upsert({
        where: { uq_inventory_user_item: { userId, itemId: outputCatalog.itemId } },
        update: { quantity: { increment: 1 } },
        create: {
          userId,
          itemId: outputCatalog.itemId,
          slot: outputCatalog.slot,
          rarity: outputCatalog.rarity,
          quantity: 1,
        },
      });

      // Write forge history (audit trail)
      await tx.forgeHistory.create({
        data: {
          userId,
          inputItems: itemIds.map((id) => ({
            itemId: id,
            rarity: inputRarity,
          })),
          outputItemId: outputCatalog.itemId,
          outputRarity,
        },
      });
    });

    // Award forge bonus coins (5 coins per forge)
    await this.prisma.userProgression.update({
      where: { userId },
      data: { coins: { increment: 5 } },
    });

    return {
      itemId: outputCatalog.itemId,
      slot: outputCatalog.slot,
      rarity: outputCatalog.rarity,
      name: outputCatalog.name,
      description: outputCatalog.description,
      attributeBonus: outputCatalog.attributeBonus as Record<string, number>,
      coinsAwarded: 5,
    };
  }
}

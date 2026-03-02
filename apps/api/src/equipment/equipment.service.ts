import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AttributeKey } from '@plan2skill/types';

const ATTRIBUTE_KEYS: AttributeKey[] = ['MAS', 'INS', 'INF', 'RES', 'VER', 'DIS'];
const VALID_SLOTS = ['weapon', 'shield', 'armor', 'helmet', 'boots', 'ring', 'companion'];

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get user's full inventory with catalog details */
  async getInventory(userId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { userId },
      orderBy: [{ rarity: 'desc' }, { slot: 'asc' }, { acquiredAt: 'desc' }],
    });

    // Join with catalog for names/descriptions
    const itemIds = items.map((i) => i.itemId);
    const catalogItems = await this.prisma.equipmentCatalog.findMany({
      where: { itemId: { in: itemIds }, isActive: true },
    });
    const catalogMap = new Map(catalogItems.map((c) => [c.itemId, c]));

    return items.map((item) => {
      const catalog = catalogMap.get(item.itemId);
      return {
        id: item.id,
        itemId: item.itemId,
        slot: item.slot,
        rarity: item.rarity,
        quantity: item.quantity,
        acquiredAt: item.acquiredAt.toISOString(),
        name: catalog?.name ?? item.itemId,
        description: catalog?.description ?? '',
        attributeBonus: (catalog?.attributeBonus as Record<string, number>) ?? {},
      };
    });
  }

  /** Add item to user's inventory (upsert — increment quantity on conflict) */
  async addItem(userId: string, itemId: string, slot: string, rarity: string) {
    return this.prisma.inventoryItem.upsert({
      where: { uq_inventory_user_item: { userId, itemId } },
      update: { quantity: { increment: 1 } },
      create: { userId, itemId, slot, rarity, quantity: 1 },
    });
  }

  /** Get currently equipped items for user's character */
  async getEquipped(userId: string) {
    const character = await this.prisma.character.findUnique({
      where: { userId },
      include: { equipment: true },
    });
    if (!character) return [];

    // Join with catalog
    const itemIds = character.equipment.map((e) => e.itemId);
    const catalogItems = await this.prisma.equipmentCatalog.findMany({
      where: { itemId: { in: itemIds }, isActive: true },
    });
    const catalogMap = new Map(catalogItems.map((c) => [c.itemId, c]));

    return character.equipment.map((e) => {
      const catalog = catalogMap.get(e.itemId);
      return {
        id: e.id,
        slot: e.slot,
        itemId: e.itemId,
        rarity: e.rarity,
        equippedAt: e.equippedAt.toISOString(),
        name: catalog?.name ?? e.itemId,
        description: catalog?.description ?? '',
        attributeBonus: (catalog?.attributeBonus as Record<string, number>) ?? {},
      };
    });
  }

  /** Equip an item to a slot — validate ownership + slot match */
  async equip(userId: string, slot: string, itemId: string) {
    if (!VALID_SLOTS.includes(slot)) {
      throw new BadRequestException(`Invalid equipment slot: ${slot}`);
    }

    // Validate user owns this item
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { uq_inventory_user_item: { userId, itemId } },
    });
    if (!inventoryItem || inventoryItem.quantity < 1) {
      throw new BadRequestException('You do not own this item, hero!');
    }

    // Validate slot matches item's slot
    const catalogItem = await this.prisma.equipmentCatalog.findUnique({
      where: { itemId },
    });
    if (!catalogItem || catalogItem.slot !== slot) {
      throw new BadRequestException('This item cannot be equipped in that slot!');
    }

    // Get character
    const character = await this.prisma.character.findUnique({ where: { userId } });
    if (!character) throw new NotFoundException('Character not found');

    // Upsert equipment (replace existing item in slot)
    const equipped = await this.prisma.characterEquipment.upsert({
      where: { characterId_slot: { characterId: character.id, slot } },
      update: { itemId, rarity: catalogItem.rarity, equippedAt: new Date() },
      create: { characterId: character.id, slot, itemId, rarity: catalogItem.rarity },
    });

    return {
      id: equipped.id,
      slot: equipped.slot,
      itemId: equipped.itemId,
      rarity: equipped.rarity,
      equippedAt: equipped.equippedAt.toISOString(),
      name: catalogItem.name,
      attributeBonus: catalogItem.attributeBonus as Record<string, number>,
    };
  }

  /** Unequip a slot */
  async unequip(userId: string, slot: string) {
    if (!VALID_SLOTS.includes(slot)) {
      throw new BadRequestException(`Invalid equipment slot: ${slot}`);
    }

    const character = await this.prisma.character.findUnique({ where: { userId } });
    if (!character) throw new NotFoundException('Character not found');

    await this.prisma.characterEquipment.deleteMany({
      where: { characterId: character.id, slot },
    });

    return { success: true };
  }

  /**
   * Compute attributes: base 10 + SUM(equipped item bonuses).
   * Returns { base: Record, bonus: Record, total: Record }.
   */
  async computeAttributes(userId: string) {
    const base: Record<string, number> = {};
    const bonus: Record<string, number> = {};
    const total: Record<string, number> = {};

    for (const key of ATTRIBUTE_KEYS) {
      base[key] = 10;
      bonus[key] = 0;
    }

    const character = await this.prisma.character.findUnique({
      where: { userId },
      include: { equipment: true },
    });

    if (character) {
      const itemIds = character.equipment.map((e) => e.itemId);
      if (itemIds.length > 0) {
        const catalogItems = await this.prisma.equipmentCatalog.findMany({
          where: { itemId: { in: itemIds }, isActive: true },
        });

        for (const catalog of catalogItems) {
          const bonuses = catalog.attributeBonus as Record<string, number>;
          if (bonuses) {
            for (const key of ATTRIBUTE_KEYS) {
              if (bonuses[key] != null) {
                bonus[key] = (bonus[key] ?? 0) + bonuses[key];
              }
            }
          }
        }
      }
    }

    for (const key of ATTRIBUTE_KEYS) {
      total[key] = (base[key] ?? 10) + (bonus[key] ?? 0);
    }

    return { base, bonus, total };
  }
}

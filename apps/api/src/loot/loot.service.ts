import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';

/**
 * Loot Service — server-side loot rolls (DEC-5F-05: anti-cheat).
 * Guaranteed 100% drop per quest completion (DEC-5F-01).
 */

// ─── Drop Rate Tables (§4.1) ─────────────────────────────────
// Weighted distribution by quest rarity → item rarity

type RarityWeights = { common: number; uncommon: number; rare: number; epic: number; legendary: number };

const DROP_RATES: Record<string, RarityWeights> = {
  common:    { common: 50, uncommon: 25, rare: 15, epic: 8,  legendary: 2  },
  uncommon:  { common: 40, uncommon: 25, rare: 20, epic: 10, legendary: 5  },
  rare:      { common: 30, uncommon: 30, rare: 25, epic: 12, legendary: 3  },
  epic:      { common: 15, uncommon: 25, rare: 30, epic: 20, legendary: 10 },
  legendary: { common: 10, uncommon: 15, rare: 30, epic: 25, legendary: 20 },
};

// ─── Slot Affinity Tables (§4.2) ──────────────────────────────
// Skill Domain → Primary (60%) / Secondary (25%) / Random (15%)

const SLOT_AFFINITY: Record<string, { primary: string; secondary: string }> = {
  'Hard Skills':     { primary: 'weapon',    secondary: 'helmet'    },
  'Communication':   { primary: 'shield',    secondary: 'ring'      },
  'Personal Brand':  { primary: 'armor',     secondary: 'companion' },
  'Strategy':        { primary: 'helmet',    secondary: 'weapon'    },
  'Adaptability':    { primary: 'boots',     secondary: 'armor'     },
  'Expertise':       { primary: 'ring',      secondary: 'shield'    },
  'Hobbies':         { primary: 'companion', secondary: 'boots'     },
};

const ALL_SLOTS = ['weapon', 'shield', 'armor', 'helmet', 'boots', 'ring', 'companion'];

@Injectable()
export class LootService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
  ) {}

  /**
   * Roll loot after quest completion.
   * Returns the dropped item catalog entry + inventory record.
   * Anti-gaming (§12): 30s cooldown, 15 drops/day.
   */
  async rollLoot(userId: string, questRarity: string, skillDomain: string | null) {
    // Anti-gaming: daily cap (15 drops/day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayDrops = await this.prisma.inventoryItem.count({
      where: { userId, acquiredAt: { gte: startOfDay } },
    });
    if (todayDrops >= 15) {
      return null; // Silent cap — no error, just no drop
    }

    // Anti-gaming: 30s cooldown between drops
    const lastDrop = await this.prisma.inventoryItem.findFirst({
      where: { userId },
      orderBy: { acquiredAt: 'desc' },
    });
    if (lastDrop) {
      const secondsSince = (Date.now() - lastDrop.acquiredAt.getTime()) / 1000;
      if (secondsSince < 30) {
        return null; // Silent cooldown
      }
    }

    // 1. Roll item rarity
    const itemRarity = this.rollRarity(questRarity);

    // 2. Roll slot (skill domain affinity)
    const slot = this.rollSlot(skillDomain);

    // 3. Find matching catalog items
    const candidates = await this.prisma.equipmentCatalog.findMany({
      where: { slot, rarity: itemRarity, isActive: true, validTo: null },
    });

    if (candidates.length === 0) {
      // EC-01: No matching item — fallback to any item of that rarity
      const fallback = await this.prisma.equipmentCatalog.findMany({
        where: { rarity: itemRarity, isActive: true, validTo: null },
      });
      if (fallback.length === 0) return null;
      const item = fallback[Math.floor(Math.random() * fallback.length)]!;
      await this.equipmentService.addItem(userId, item.itemId, item.slot, item.rarity);
      return this.mapCatalogItem(item);
    }

    // 4. Random pick from candidates
    const item = candidates[Math.floor(Math.random() * candidates.length)]!;

    // 5. Add to inventory (upsert)
    await this.equipmentService.addItem(userId, item.itemId, item.slot, item.rarity);

    return this.mapCatalogItem(item);
  }

  /** Roll item rarity based on quest rarity — weighted random */
  private rollRarity(questRarity: string): string {
    const weights = DROP_RATES[questRarity] ?? DROP_RATES.common!;
    const roll = Math.random() * 100;
    let cumulative = 0;

    for (const [rarity, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (roll < cumulative) return rarity;
    }

    return 'common';
  }

  /** Roll slot with skill domain affinity (60% / 25% / 15%) */
  private rollSlot(skillDomain: string | null): string {
    const affinity = skillDomain ? SLOT_AFFINITY[skillDomain] : null;

    if (!affinity) {
      // No affinity — pure random
      return ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]!;
    }

    const roll = Math.random() * 100;
    if (roll < 60) return affinity.primary;
    if (roll < 85) return affinity.secondary;

    // 15% — random from all slots
    return ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]!;
  }

  private mapCatalogItem(item: {
    id: string; itemId: string; slot: string; rarity: string;
    name: string; description: string; attributeBonus: unknown;
  }) {
    return {
      id: item.id,
      itemId: item.itemId,
      slot: item.slot,
      rarity: item.rarity,
      name: item.name,
      description: item.description,
      attributeBonus: item.attributeBonus as Record<string, number>,
    };
  }
}

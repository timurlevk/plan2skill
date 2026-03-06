import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../ai/core/cache.service';
import type { ArchetypeId, CharacterId, CompanionId } from '@plan2skill/types';

/**
 * Diminishing returns for attribute growth.
 * Canonical formula — ОДНА СКРІЗЬ (client: level-utils.ts, server: here).
 * Scale factor: linear from 1.0 (at base 10) to 0.0 (at cap 100).
 * Always grants minimum 1 if below cap and rawGrowth > 0.
 */
function attributeGrowth(rawGrowth: number, currentValue: number): number {
  if (currentValue >= 100 || rawGrowth <= 0) return 0;
  const remaining = (100 - currentValue) / 90;
  const effective = rawGrowth * remaining;
  return Math.max(1, Math.round(effective));
}

@Injectable()
export class CharacterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getCharacter(userId: string) {
    const character = await this.prisma.character.findUnique({
      where: { userId },
      include: { equipment: true },
    });
    if (!character) throw new NotFoundException('Character not found');
    return this.mapCharacter(character);
  }

  async createCharacter(
    userId: string,
    characterId: CharacterId,
    archetypeId: ArchetypeId,
    companionId: CompanionId | null,
  ) {
    const existing = await this.prisma.character.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Character already exists');

    const character = await this.prisma.character.create({
      data: {
        userId,
        characterId,
        archetypeId,
        companionId,
        evolutionTier: 'novice',
        strength: 10,
        intelligence: 10,
        charisma: 10,
        constitution: 10,
        dexterity: 10,
        wisdom: 10,
      },
      include: { equipment: true },
    });

    this.cacheService.invalidateForEvent(userId, 'character_change').catch(() => {});

    return this.mapCharacter(character);
  }

  async updateArchetype(userId: string, archetypeId: ArchetypeId) {
    const result = await this.prisma.character.update({
      where: { userId },
      data: { archetypeId },
    });
    await this.cacheService.invalidateForEvent(userId, 'character_change');
    return result;
  }

  /** Add attribute with diminishing returns (Phase 5H). Returns effective growth amount. */
  async addAttribute(userId: string, attribute: string, rawAmount: number): Promise<number> {
    const field = this.attributeField(attribute);
    const character = await this.prisma.character.findUnique({ where: { userId } });
    if (!character) return 0;

    const currentValue = (character as any)[field] ?? 10;
    const effective = attributeGrowth(rawAmount, currentValue);
    if (effective <= 0) return 0;

    await this.prisma.character.update({
      where: { userId },
      data: { [field]: { increment: effective } },
    });
    await this.cacheService.invalidateForEvent(userId, 'character_change');
    return effective;
  }

  async checkEvolution(userId: string) {
    const character = await this.prisma.character.findUnique({ where: { userId } });
    if (!character) return null;

    const totalAttrs =
      character.strength +
      character.intelligence +
      character.charisma +
      character.constitution +
      character.dexterity +
      character.wisdom;

    let newTier = 'novice';
    if (totalAttrs >= 300) newTier = 'master';
    else if (totalAttrs >= 180) newTier = 'practitioner';
    else if (totalAttrs >= 80) newTier = 'apprentice';

    if (newTier !== character.evolutionTier) {
      await this.prisma.character.update({
        where: { userId },
        data: { evolutionTier: newTier },
      });
      this.cacheService.invalidateForEvent(userId, 'character_change').catch(() => {});
      return newTier;
    }
    return null;
  }

  private attributeField(attr: string): string {
    const map: Record<string, string> = {
      STR: 'strength',
      INT: 'intelligence',
      CHA: 'charisma',
      CON: 'constitution',
      DEX: 'dexterity',
      WIS: 'wisdom',
    };
    return map[attr] || 'strength';
  }

  private mapCharacter(character: {
    id: string;
    userId: string;
    characterId: string;
    archetypeId: string;
    evolutionTier: string;
    companionId: string | null;
    strength: number;
    intelligence: number;
    charisma: number;
    constitution: number;
    dexterity: number;
    wisdom: number;
    createdAt: Date;
    updatedAt: Date;
    equipment: Array<{
      id: string;
      characterId: string;
      slot: string;
      itemId: string;
      rarity: string;
      equippedAt: Date;
    }>;
  }) {
    return {
      id: character.id,
      userId: character.userId,
      characterId: character.characterId,
      archetypeId: character.archetypeId,
      evolutionTier: character.evolutionTier,
      companionId: character.companionId,
      attributes: {
        STR: character.strength,
        INT: character.intelligence,
        CHA: character.charisma,
        CON: character.constitution,
        DEX: character.dexterity,
        WIS: character.wisdom,
      },
      equipment: character.equipment.map((e) => ({
        id: e.id,
        characterId: e.characterId,
        slot: e.slot,
        itemId: e.itemId,
        rarity: e.rarity,
        equippedAt: e.equippedAt.toISOString(),
      })),
      createdAt: character.createdAt.toISOString(),
      updatedAt: character.updatedAt.toISOString(),
    };
  }
}

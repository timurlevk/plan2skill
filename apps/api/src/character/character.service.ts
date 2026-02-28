import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ArchetypeId, CharacterId, CompanionId } from '@plan2skill/types';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

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
        mastery: 10,
        insight: 10,
        influence: 10,
        resilience: 10,
        versatility: 10,
        discovery: 10,
      },
      include: { equipment: true },
    });

    return this.mapCharacter(character);
  }

  async updateArchetype(userId: string, archetypeId: ArchetypeId) {
    return this.prisma.character.update({
      where: { userId },
      data: { archetypeId },
    });
  }

  async addAttribute(userId: string, attribute: string, amount: number) {
    const field = this.attributeField(attribute);
    return this.prisma.character.update({
      where: { userId },
      data: { [field]: { increment: amount } },
    });
  }

  async checkEvolution(userId: string) {
    const character = await this.prisma.character.findUnique({ where: { userId } });
    if (!character) return null;

    const totalAttrs =
      character.mastery +
      character.insight +
      character.influence +
      character.resilience +
      character.versatility +
      character.discovery;

    let newTier = 'novice';
    if (totalAttrs >= 300) newTier = 'master';
    else if (totalAttrs >= 180) newTier = 'practitioner';
    else if (totalAttrs >= 80) newTier = 'apprentice';

    if (newTier !== character.evolutionTier) {
      await this.prisma.character.update({
        where: { userId },
        data: { evolutionTier: newTier },
      });
      return newTier;
    }
    return null;
  }

  private attributeField(attr: string): string {
    const map: Record<string, string> = {
      MAS: 'mastery',
      INS: 'insight',
      INF: 'influence',
      RES: 'resilience',
      VER: 'versatility',
      DIS: 'discovery',
    };
    return map[attr] || 'mastery';
  }

  private mapCharacter(character: {
    id: string;
    userId: string;
    characterId: string;
    archetypeId: string;
    evolutionTier: string;
    companionId: string | null;
    mastery: number;
    insight: number;
    influence: number;
    resilience: number;
    versatility: number;
    discovery: number;
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
        MAS: character.mastery,
        INS: character.insight,
        INF: character.influence,
        RES: character.resilience,
        VER: character.versatility,
        DIS: character.discovery,
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

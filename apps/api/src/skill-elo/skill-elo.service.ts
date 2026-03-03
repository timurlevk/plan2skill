import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ELO_K_FACTOR = 32;
const ELO_MIN = 800;
const ELO_MAX = 2000;

@Injectable()
export class SkillEloService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update Elo after quest completion.
   * @param quality - 0.0 to 1.0 quality score from quest validation
   * @param difficulty - 1-5 difficulty tier (mapped to question Elo)
   */
  async updateAfterQuest(
    userId: string,
    skillDomain: string,
    quality: number,
    difficulty: number,
  ): Promise<void> {
    if (!skillDomain) return;

    const current = await this.getElo(userId, skillDomain);
    const questionElo = 800 + (difficulty - 1) * 200;
    const newElo = this.calculateNewElo(current, questionElo, quality);

    await this.prisma.skillElo.upsert({
      where: { uq_skill_elo_user_domain: { userId, skillDomain } },
      create: {
        userId,
        skillDomain,
        elo: newElo,
        assessmentCount: 1,
        lastAssessedAt: new Date(),
      },
      update: {
        elo: newElo,
        assessmentCount: { increment: 1 },
        lastAssessedAt: new Date(),
      },
    });
  }

  /**
   * Update Elo after assessment (batch update from multiple questions).
   */
  async updateAfterAssessment(
    userId: string,
    skillDomain: string,
    results: Array<{ correct: boolean; difficultyElo: number }>,
  ): Promise<void> {
    let currentElo = await this.getElo(userId, skillDomain);

    for (const result of results) {
      const quality = result.correct ? 1.0 : 0.0;
      currentElo = this.calculateNewElo(currentElo, result.difficultyElo, quality);
    }

    await this.prisma.skillElo.upsert({
      where: { uq_skill_elo_user_domain: { userId, skillDomain } },
      create: {
        userId,
        skillDomain,
        elo: currentElo,
        assessmentCount: results.length,
        lastAssessedAt: new Date(),
      },
      update: {
        elo: currentElo,
        assessmentCount: { increment: results.length },
        lastAssessedAt: new Date(),
      },
    });
  }

  async getElo(userId: string, skillDomain: string): Promise<number> {
    const record = await this.prisma.skillElo.findUnique({
      where: { uq_skill_elo_user_domain: { userId, skillDomain } },
      select: { elo: true },
    });
    return record?.elo ?? 1200;
  }

  async getAllElos(userId: string): Promise<Array<{ skillDomain: string; elo: number }>> {
    const records = await this.prisma.skillElo.findMany({
      where: { userId },
      orderBy: { elo: 'desc' },
      select: { skillDomain: true, elo: true },
    });
    return records;
  }

  /**
   * Standard Elo calculation with K-factor.
   * Expected = 1 / (1 + 10^((questionElo - userElo) / 400))
   * NewElo = userElo + K * (actual - expected)
   */
  private calculateNewElo(userElo: number, questionElo: number, actual: number): number {
    const expected = 1 / (1 + Math.pow(10, (questionElo - userElo) / 400));
    const newElo = Math.round(userElo + ELO_K_FACTOR * (actual - expected));
    return Math.max(ELO_MIN, Math.min(ELO_MAX, newElo));
  }
}

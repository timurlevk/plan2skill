import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentGenerator, type AssessmentGeneratorInput } from '../ai/generators/assessment.generator';
import type { AiAssessment } from '../ai/schemas/assessment.schema';

export interface AssessmentAnswer {
  questionIndex: number;
  selectedIndex: number;
}

export interface AssessmentResult {
  score: number;
  total: number;
  percentage: number;
  initialElo: number;
  skillDomain: string;
  questionResults: Array<{
    questionIndex: number;
    correct: boolean;
    correctIndex: number;
    explanation: string;
  }>;
}

@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assessmentGenerator: AssessmentGenerator,
  ) {}

  async generateAssessment(
    userId: string,
    input: AssessmentGeneratorInput,
  ): Promise<AiAssessment> {
    return this.assessmentGenerator.generate(userId, input);
  }

  async submitAssessment(
    userId: string,
    skillDomain: string,
    questions: AiAssessment['questions'],
    answers: AssessmentAnswer[],
  ): Promise<AssessmentResult> {
    let correctCount = 0;
    const questionResults: AssessmentResult['questionResults'] = [];

    for (const answer of answers) {
      const question = questions[answer.questionIndex];
      if (!question) continue;

      const correct = answer.selectedIndex === question.correctIndex;
      if (correct) correctCount++;

      questionResults.push({
        questionIndex: answer.questionIndex,
        correct,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      });
    }

    const total = questions.length;
    const percentage = total > 0 ? correctCount / total : 0;

    // Calculate initial Elo: base 1200 + performance adjustment
    const baseElo = 1200;
    const performanceAdjust = Math.round(percentage * 400 - 200);
    const initialElo = Math.max(800, Math.min(2000, baseElo + performanceAdjust));

    // Upsert SkillElo
    await this.prisma.skillElo.upsert({
      where: { uq_skill_elo_user_domain: { userId, skillDomain } },
      create: {
        userId,
        skillDomain,
        elo: initialElo,
        assessmentCount: 1,
        lastAssessedAt: new Date(),
      },
      update: {
        elo: initialElo,
        assessmentCount: { increment: 1 },
        lastAssessedAt: new Date(),
      },
    });

    return {
      score: correctCount,
      total,
      percentage,
      initialElo,
      skillDomain,
      questionResults,
    };
  }
}

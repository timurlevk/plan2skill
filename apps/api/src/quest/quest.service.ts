import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestGenerator } from '../ai/generators/quest.generator';
import { QuestAssistantGenerator } from '../ai/generators/quest-assistant.generator';
import type { QuestAssistantMode } from '../ai/schemas/quest-assistant.schema';

/**
 * Quest Engine v2 (Phase 5C)
 *
 * Responsibilities:
 * - DA-06: Daily quest allocation with type diversity enforcement
 * - Quest validation dispatch (knowledge check, effort reflection, etc.)
 * - AI quest generation + attempt recording + quest assist
 *
 * Note: XP cap enforcement (DA-07) lives in ProgressionService.
 */

// ─── Quest Type Diversity (max 2 of same type per day) ──────────

const MAX_SAME_TYPE_PER_DAY = 2;
const DAILY_QUEST_COUNT = 5;

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly questGenerator: QuestGenerator,
    private readonly questAssistantGenerator: QuestAssistantGenerator,
  ) {}

  /**
   * DA-06: Get today's quests for a user with diversity enforcement.
   * Rules:
   * - Max 5 quests per day
   * - Max 2 of the same quest type
   * - Prefer unlocked tasks from active milestone
   * - Difficulty calibration: match user's avg quality score
   */
  async getDailyQuests(userId: string) {
    // Get user's active roadmaps
    const roadmaps = await this.prisma.roadmap.findMany({
      where: { userId, status: 'active' },
      include: {
        milestones: {
          where: { status: { in: ['active', 'in_progress'] } },
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { status: { in: ['available', 'locked'] } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    // Flatten available tasks across roadmaps
    const candidateTasks = roadmaps.flatMap((r) =>
      r.milestones.flatMap((m) => m.tasks),
    );

    if (candidateTasks.length === 0) return [];

    // Check what types already completed today
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone ?? 'UTC';
    const todayStart = this.todayStartInTimezone(timezone);

    const todayCompletions = await this.prisma.questCompletion.findMany({
      where: {
        userId,
        completedAt: { gte: todayStart },
      },
      select: { questType: true, taskId: true },
    });

    const completedTaskIds = new Set(todayCompletions.map((c) => c.taskId));
    const typeCountToday = new Map<string, number>();
    for (const c of todayCompletions) {
      typeCountToday.set(c.questType, (typeCountToday.get(c.questType) ?? 0) + 1);
    }

    // Select quests with diversity enforcement
    const selected: typeof candidateTasks = [];
    const selectionTypeCounts = new Map<string, number>();

    for (const task of candidateTasks) {
      if (selected.length >= DAILY_QUEST_COUNT) break;
      if (completedTaskIds.has(task.id)) continue;

      const existingCount =
        (typeCountToday.get(task.questType) ?? 0) +
        (selectionTypeCounts.get(task.questType) ?? 0);

      if (existingCount >= MAX_SAME_TYPE_PER_DAY) continue;

      selected.push(task);
      selectionTypeCounts.set(
        task.questType,
        (selectionTypeCounts.get(task.questType) ?? 0) + 1,
      );
    }

    // If we don't have enough diverse quests, fill remaining slots ignoring type constraint
    if (selected.length < DAILY_QUEST_COUNT) {
      for (const task of candidateTasks) {
        if (selected.length >= DAILY_QUEST_COUNT) break;
        if (completedTaskIds.has(task.id)) continue;
        if (selected.some((s) => s.id === task.id)) continue;
        selected.push(task);
      }
    }

    return selected.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      questType: task.questType,
      estimatedMinutes: task.estimatedMinutes,
      xpReward: task.xpReward,
      coinReward: task.coinReward,
      rarity: task.rarity,
      difficultyTier: task.difficultyTier,
      validationType: task.validationType,
      knowledgeCheck: task.knowledgeCheck,
      skillDomain: task.skillDomain,
    }));
  }

  /**
   * Validate a quest completion based on validation type.
   * Returns quality score (0.0-1.0) for engagement depth.
   */
  validateCompletion(
    validationType: string,
    validationData: Record<string, unknown>,
    knowledgeCheck: unknown,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    switch (validationType) {
      case 'knowledge_quiz':
        return this.validateKnowledgeQuiz(validationData, knowledgeCheck);
      case 'effort_reflection':
        return this.validateEffortReflection(validationData);
      case 'completion_attestation':
        return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };
      case 'journal_entry':
        return this.validateJournalEntry(validationData);
      default:
        return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };
    }
  }

  private validateKnowledgeQuiz(
    data: Record<string, unknown>,
    knowledgeCheck: unknown,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    const check = knowledgeCheck as {
      correctIndex: number;
      explanation?: string;
    } | null;
    if (!check) return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };

    const selectedIndex = data.selectedIndex as number | undefined;
    const correct = selectedIndex === check.correctIndex;

    return {
      valid: true, // Even wrong answers count — learning from mistakes
      qualityScore: correct ? 1.0 : 0.3,
      feedback: correct
        ? 'Knowledge mastered!'
        : check.explanation ?? 'Keep studying, hero!',
    };
  }

  private validateEffortReflection(
    data: Record<string, unknown>,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    const rpe = data.rpe as number | undefined; // Rate of Perceived Exertion (1-10)
    if (rpe == null) return { valid: true, qualityScore: 0.5, feedback: 'Quest Complete!' };

    // Higher effort = higher quality score
    const qualityScore = Math.min(1.0, rpe / 10);
    return {
      valid: true,
      qualityScore,
      feedback: rpe >= 7 ? 'Heroic effort!' : 'Well done, hero!',
    };
  }

  private validateJournalEntry(
    data: Record<string, unknown>,
  ): { valid: boolean; qualityScore: number; feedback: string } {
    const text = data.text as string | undefined;
    if (!text || text.trim().length < 10) {
      return { valid: false, qualityScore: 0, feedback: 'Write at least a few sentences, hero.' };
    }

    // Quality based on reflection depth (word count as proxy)
    const wordCount = text.trim().split(/\s+/).length;
    const qualityScore = Math.min(1.0, wordCount / 50);
    return {
      valid: true,
      qualityScore,
      feedback: wordCount >= 30 ? 'Deep reflection!' : 'Quest Complete!',
    };
  }

  /**
   * Generate AI-powered daily quests for user's active milestone.
   */
  async generateDailyQuests(userId: string): Promise<Array<{
    id: string;
    title: string;
    description: string;
    taskType: string;
    questType: string;
    estimatedMinutes: number;
    xpReward: number;
    coinReward: number;
    rarity: string;
    skillDomain: string | null;
  }>> {
    // Find active roadmap + active milestone
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { userId, status: 'active' },
      include: {
        milestones: {
          where: { status: { in: ['active', 'in_progress'] } },
          orderBy: { order: 'asc' },
          take: 1,
          include: {
            tasks: {
              where: { status: { in: ['available', 'locked'] } },
              select: { title: true, skillDomain: true },
            },
          },
        },
      },
    });

    if (!roadmap || roadmap.milestones.length === 0) {
      return [];
    }

    const milestone = roadmap.milestones[0]!;
    const existingTitles = milestone.tasks.map((t) => t.title);

    // Determine skill domains from milestone tasks
    const domains = [...new Set(milestone.tasks.map((t) => t.skillDomain).filter(Boolean))] as string[];
    const skillDomain = domains[0] ?? 'general';

    const result = await this.questGenerator.generate(userId, {
      skillDomain,
      milestoneId: milestone.id,
      count: Math.min(5, DAILY_QUEST_COUNT),
      dailyMinutes: roadmap.dailyMinutes ?? 30,
      existingTaskTitles: existingTitles,
    });

    // Determine base order from existing tasks to avoid overlap on repeated calls
    const maxOrder = await this.prisma.task.aggregate({
      where: { milestoneId: milestone.id },
      _max: { order: true },
    });
    const baseOrder = (maxOrder._max.order ?? 0) + 1;

    // Persist generated quests as Task rows
    const createdTasks = [];
    for (let i = 0; i < result.quests.length; i++) {
      const quest = result.quests[i]!;
      const task = await this.prisma.task.create({
        data: {
          milestoneId: milestone.id,
          title: quest.title,
          description: quest.description,
          taskType: quest.taskType,
          questType: quest.questType,
          estimatedMinutes: quest.estimatedMinutes,
          xpReward: quest.xpReward,
          coinReward: quest.coinReward,
          rarity: quest.rarity,
          skillDomain: quest.skillDomain,
          bloomLevel: quest.bloomLevel,
          difficultyTier: quest.difficultyTier,
          knowledgeCheck: quest.knowledgeCheck as any,
          validationType: quest.knowledgeCheck ? 'knowledge_quiz' : 'completion_attestation',
          status: 'available',
          order: baseOrder + i,
        },
      });

      createdTasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        questType: task.questType,
        estimatedMinutes: task.estimatedMinutes,
        xpReward: task.xpReward,
        coinReward: task.coinReward,
        rarity: task.rarity,
        skillDomain: task.skillDomain,
      });
    }

    return createdTasks;
  }

  /**
   * Record a task attempt for L3 quest session context.
   * Creates a TaskAttempt row with auto-incrementing attemptNumber.
   */
  async recordAttempt(
    userId: string,
    taskId: string,
    data: {
      selectedIndex?: number;
      answerData?: Record<string, unknown>;
      correct?: boolean;
      timeSpentSeconds?: number;
      hintsRequested?: number;
    },
  ) {
    // Get next attempt number
    const lastAttempt = await this.prisma.taskAttempt.findFirst({
      where: { userId, taskId },
      orderBy: { attemptNumber: 'desc' },
      select: { attemptNumber: true },
    });
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    return this.prisma.taskAttempt.create({
      data: {
        userId,
        taskId,
        attemptNumber,
        selectedIndex: data.selectedIndex ?? null,
        answerData: (data.answerData as any) ?? null,
        correct: data.correct ?? null,
        submittedAt: new Date(),
        timeSpentSeconds: data.timeSpentSeconds ?? null,
        hintsRequested: data.hintsRequested ?? 0,
      },
    });
  }

  /**
   * Quest Assistant — AI-powered hint/feedback/reattempt support.
   * Uses L3 quest session context for attempt-aware responses.
   */
  async questAssist(
    userId: string,
    taskId: string,
    mode: QuestAssistantMode,
    userMessage?: string,
  ) {
    return this.questAssistantGenerator.generate(userId, {
      taskId,
      mode,
      userMessage,
    });
  }

  /**
   * Get the start of today in the user's timezone, expressed as a UTC Date.
   * Uses Intl to get the UTC offset for the timezone, then adjusts accordingly.
   */
  private todayStartInTimezone(timezone: string): Date {
    const now = new Date();
    // Get "today" in user's timezone as YYYY-MM-DD
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    // Get the timezone offset by comparing local midnight to UTC
    const midnightLocal = new Date(`${dateStr}T00:00:00`);
    const midnightInTz = new Date(
      midnightLocal.toLocaleString('en-US', { timeZone: timezone }),
    );
    const midnightUtc = new Date(
      midnightLocal.toLocaleString('en-US', { timeZone: 'UTC' }),
    );
    const offsetMs = midnightUtc.getTime() - midnightInTz.getTime();
    return new Date(midnightLocal.getTime() + offsetMs);
  }
}

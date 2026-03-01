import { Injectable, type OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import { TrpcService } from './trpc.service';
import { UserService } from '../user/user.service';
import { CharacterService } from '../character/character.service';
import { ProgressionService } from '../progression/progression.service';
import { RoadmapService } from '../roadmap/roadmap.service';
import { QuestService } from '../quest/quest.service';
import { SpacedRepetitionService } from '../spaced-repetition/spaced-repetition.service';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class TrpcRouter implements OnModuleInit {
  appRouter!: ReturnType<typeof this.buildRouter>;

  constructor(
    private readonly trpc: TrpcService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly userService: UserService,
    private readonly characterService: CharacterService,
    private readonly progressionService: ProgressionService,
    private readonly roadmapService: RoadmapService,
    private readonly questService: QuestService,
    private readonly spacedRepetitionService: SpacedRepetitionService,
    private readonly achievementService: AchievementService,
  ) {}

  private buildRouter() {
    const { router, protectedProcedure } = this.trpc;

    const userRouter = router({
      profile: protectedProcedure.query(({ ctx }) => {
        return this.userService.getProfile(ctx.userId);
      }),
      updateDisplayName: protectedProcedure
        .input(z.object({ displayName: z.string().min(2).max(50) }))
        .mutation(({ ctx, input }) => {
          return this.userService.updateDisplayName(ctx.userId, input.displayName);
        }),
      completeOnboarding: protectedProcedure.mutation(({ ctx }) => {
        return this.userService.completeOnboarding(ctx.userId);
      }),
      updatePreferences: protectedProcedure
        .input(
          z.object({
            quietMode: z.boolean().optional(),
            timezone: z.string().max(50).optional(),
            locale: z.string().max(10).optional(),
          }),
        )
        .mutation(({ ctx, input }) => {
          return this.userService.updatePreferences(ctx.userId, input);
        }),
    });

    const characterRouter = router({
      get: protectedProcedure.query(({ ctx }) => {
        return this.characterService.getCharacter(ctx.userId);
      }),
      create: protectedProcedure
        .input(
          z.object({
            characterId: z.enum([
              'aria', 'kofi', 'mei', 'diego',
              'zara', 'alex', 'priya', 'liam',
            ]),
            archetypeId: z.enum([
              'strategist', 'explorer', 'connector', 'builder', 'innovator',
            ]),
            companionId: z
              .enum(['cat', 'plant', 'guitar', 'robot', 'bird'])
              .nullable()
              .optional(),
          }),
        )
        .mutation(({ ctx, input }) => {
          return this.characterService.createCharacter(
            ctx.userId,
            input.characterId,
            input.archetypeId,
            input.companionId ?? null,
          );
        }),
    });

    const roadmapRouter = router({
      list: protectedProcedure.query(({ ctx }) => {
        return this.roadmapService.listRoadmaps(ctx.userId);
      }),
      get: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(({ ctx, input }) => {
          return this.roadmapService.getRoadmap(ctx.userId, input.id);
        }),
      generate: protectedProcedure
        .input(
          z.object({
            goal: z.string().min(5).max(500),
            currentRole: z.string().min(2).max(100),
            experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
            dailyMinutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(90)]),
            selectedTools: z.array(z.string()).max(10),
            superpower: z.string().max(200),
          }),
        )
        .mutation(({ ctx, input }) => {
          return this.roadmapService.generateRoadmap(ctx.userId, input);
        }),
    });

    const progressionRouter = router({
      getProfile: protectedProcedure.query(({ ctx }) => {
        return this.progressionService.getProfile(ctx.userId);
      }),
      completeTask: protectedProcedure
        .input(
          z.object({
            taskId: z.string().uuid(),
            validationResult: z.record(z.unknown()).optional(),
            timeSpentSeconds: z.number().int().positive().optional(),
          }),
        )
        .mutation(({ ctx, input }) => {
          return this.progressionService.completeTask(
            ctx.userId,
            input.taskId,
            input.validationResult ?? {},
            input.timeSpentSeconds,
          );
        }),
      rechargeEnergy: protectedProcedure.mutation(({ ctx }) => {
        return this.progressionService.rechargeEnergy(ctx.userId);
      }),
    });

    const questRouter = router({
      daily: protectedProcedure.query(({ ctx }) => {
        return this.questService.getDailyQuests(ctx.userId);
      }),
      validate: protectedProcedure
        .input(
          z.object({
            validationType: z.string().max(30),
            validationData: z.record(z.unknown()),
            knowledgeCheck: z.unknown().optional(),
          }),
        )
        .mutation(({ input }) => {
          return this.questService.validateCompletion(
            input.validationType,
            input.validationData as Record<string, unknown>,
            input.knowledgeCheck ?? null,
          );
        }),
    });

    // ─── Spaced Repetition (Phase 5D) ──────────────────────────

    const reviewRouter = router({
      due: protectedProcedure
        .input(z.object({ limit: z.number().int().min(1).max(20).default(10) }).optional())
        .query(({ ctx, input }) => {
          return this.spacedRepetitionService.getDueReviews(ctx.userId, input?.limit ?? 10);
        }),
      submit: protectedProcedure
        .input(z.object({
          skillId: z.string().max(50),
          quality: z.number().int().min(0).max(5),
        }))
        .mutation(({ ctx, input }) => {
          return this.spacedRepetitionService.submitReview(ctx.userId, input.skillId, input.quality);
        }),
      mastery: protectedProcedure.query(({ ctx }) => {
        return this.spacedRepetitionService.getSkillMastery(ctx.userId);
      }),
      create: protectedProcedure
        .input(z.object({
          skillId: z.string().max(50),
          skillDomain: z.string().max(50).optional(),
        }))
        .mutation(({ ctx, input }) => {
          return this.spacedRepetitionService.createReviewItem(ctx.userId, input.skillId, input.skillDomain);
        }),
    });

    // ─── Achievements (Phase 5E) ────────────────────────────────

    const achievementRouter = router({
      list: protectedProcedure.query(({ ctx }) => {
        return this.achievementService.getUnlockedAchievements(ctx.userId);
      }),
      unlock: protectedProcedure
        .input(z.object({
          achievementId: z.string().max(50),
          xpReward: z.number().int().min(0).default(0),
        }))
        .mutation(({ ctx, input }) => {
          return this.achievementService.unlockAchievement(ctx.userId, input.achievementId, input.xpReward);
        }),
      sync: protectedProcedure
        .input(z.object({
          achievementIds: z.array(z.string().max(50)),
        }))
        .mutation(({ ctx, input }) => {
          return this.achievementService.syncAchievements(ctx.userId, input.achievementIds);
        }),
      weeklyChallenges: protectedProcedure.query(({ ctx }) => {
        return this.achievementService.getWeeklyChallenges(ctx.userId);
      }),
    });

    return this.trpc.mergeRouters(
      router({
        user: userRouter,
        character: characterRouter,
        roadmap: roadmapRouter,
        progression: progressionRouter,
        quest: questRouter,
        review: reviewRouter,
        achievement: achievementRouter,
      }),
    );
  }

  onModuleInit() {
    this.appRouter = this.buildRouter();

    const app = this.httpAdapterHost.httpAdapter.getInstance();
    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext: ({ req }) => this.trpc.createContext(req),
      }),
    );
  }
}

// Export the router type for type-safe client
export type AppRouter = TrpcRouter['appRouter'];

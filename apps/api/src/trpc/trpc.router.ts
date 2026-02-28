import { Injectable, type OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import { TrpcService } from './trpc.service';
import { UserService } from '../user/user.service';
import { CharacterService } from '../character/character.service';
import { ProgressionService } from '../progression/progression.service';
import { RoadmapService } from '../roadmap/roadmap.service';

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
      completeTask: protectedProcedure
        .input(z.object({ taskId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
          return this.progressionService.completeTask(ctx.userId, input.taskId);
        }),
    });

    return this.trpc.mergeRouters(
      router({
        user: userRouter,
        character: characterRouter,
        roadmap: roadmapRouter,
        progression: progressionRouter,
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

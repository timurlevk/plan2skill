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
  constructor(
    private readonly trpc: TrpcService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly userService: UserService,
    private readonly characterService: CharacterService,
    private readonly progressionService: ProgressionService,
    private readonly roadmapService: RoadmapService,
  ) {}

  // ─── User Router ─────────────────────────────────────────────
  userRouter = this.trpc.router({
    profile: this.trpc.protectedProcedure.query(({ ctx }) => {
      return this.userService.getProfile(ctx.userId);
    }),
    updateDisplayName: this.trpc.protectedProcedure
      .input(z.object({ displayName: z.string().min(2).max(50) }))
      .mutation(({ ctx, input }) => {
        return this.userService.updateDisplayName(ctx.userId, input.displayName);
      }),
    completeOnboarding: this.trpc.protectedProcedure.mutation(({ ctx }) => {
      return this.userService.completeOnboarding(ctx.userId);
    }),
  });

  // ─── Character Router ────────────────────────────────────────
  characterRouter = this.trpc.router({
    get: this.trpc.protectedProcedure.query(({ ctx }) => {
      return this.characterService.getCharacter(ctx.userId);
    }),
    create: this.trpc.protectedProcedure
      .input(
        z.object({
          characterId: z.enum([
            'aria',
            'kofi',
            'mei',
            'diego',
            'zara',
            'alex',
            'priya',
            'liam',
          ]),
          archetypeId: z.enum([
            'strategist',
            'explorer',
            'connector',
            'builder',
            'innovator',
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

  // ─── Roadmap Router ──────────────────────────────────────────
  roadmapRouter = this.trpc.router({
    list: this.trpc.protectedProcedure.query(({ ctx }) => {
      return this.roadmapService.listRoadmaps(ctx.userId);
    }),
    get: this.trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(({ ctx, input }) => {
        return this.roadmapService.getRoadmap(ctx.userId, input.id);
      }),
    generate: this.trpc.protectedProcedure
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

  // ─── Progression Router ──────────────────────────────────────
  progressionRouter = this.trpc.router({
    completeTask: this.trpc.protectedProcedure
      .input(z.object({ taskId: z.string().uuid() }))
      .mutation(({ ctx, input }) => {
        return this.progressionService.completeTask(ctx.userId, input.taskId);
      }),
  });

  // ─── Merged App Router ───────────────────────────────────────
  appRouter = this.trpc.mergeRouters(
    this.trpc.router({
      user: this.userRouter,
      character: this.characterRouter,
      roadmap: this.roadmapRouter,
      progression: this.progressionRouter,
    }),
  );

  // Export type for clients
  // This type is consumed by @plan2skill/api-client
  // Type: typeof this.appRouter

  onModuleInit() {
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

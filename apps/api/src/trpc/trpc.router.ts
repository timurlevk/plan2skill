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
import { EquipmentService } from '../equipment/equipment.service';
import { LootService } from '../loot/loot.service';
import { ForgeService } from '../forge/forge.service';
import { ShopService } from '../shop/shop.service';
import { NarrativeService } from '../narrative/narrative.service';
import { AdminAiService } from '../admin/admin-ai.service';
import { AssessmentService } from '../assessment/assessment.service';
import { SkillEloService } from '../skill-elo/skill-elo.service';

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
    private readonly equipmentService: EquipmentService,
    private readonly lootService: LootService,
    private readonly forgeService: ForgeService,
    private readonly shopService: ShopService,
    private readonly narrativeService: NarrativeService,
    private readonly adminAiService: AdminAiService,
    private readonly assessmentService: AssessmentService,
    private readonly skillEloService: SkillEloService,
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
      // BL-007: Completion stats for celebration screen
      completionStats: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .query(({ ctx, input }) => {
          return this.roadmapService.getCompletionStats(ctx.userId, input.roadmapId);
        }),
      // BL-007: Trending domains (GDPR min 50 users/group)
      trending: protectedProcedure.query(() => {
        return this.roadmapService.getTrendingDomains();
      }),
      // Phase 5H: Roadmap Adjust/Pause/Resume
      adjust: protectedProcedure
        .input(z.object({
          roadmapId: z.string().uuid(),
          type: z.enum(['goals', 'pace', 'regen', 'add_topic']),
          newGoal: z.string().min(5).max(500).optional(),
          newDailyMinutes: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(90)]).optional(),
          newInterests: z.array(z.string().max(100)).max(5).optional(),
        }))
        .mutation(({ ctx, input }) => {
          return this.roadmapService.adjustRoadmap(ctx.userId, input.roadmapId, {
            type: input.type,
            newGoal: input.newGoal,
            newDailyMinutes: input.newDailyMinutes,
            newInterests: input.newInterests,
          });
        }),
      pause: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
          return this.roadmapService.pauseRoadmap(ctx.userId, input.roadmapId);
        }),
      resume: protectedProcedure
        .input(z.object({ roadmapId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
          return this.roadmapService.resumeRoadmap(ctx.userId, input.roadmapId);
        }),
      checkLimit: protectedProcedure.query(({ ctx }) => {
        return this.roadmapService.validateRoadmapLimit(ctx.userId);
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
      generateDaily: protectedProcedure.mutation(({ ctx }) => {
        return this.questService.generateDailyQuests(ctx.userId);
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

    // ─── Equipment (Phase 5F) ───────────────────────────────────

    const equipmentRouter = router({
      inventory: protectedProcedure.query(({ ctx }) => {
        return this.equipmentService.getInventory(ctx.userId);
      }),
      equipped: protectedProcedure.query(({ ctx }) => {
        return this.equipmentService.getEquipped(ctx.userId);
      }),
      equip: protectedProcedure
        .input(z.object({
          slot: z.enum(['weapon', 'shield', 'armor', 'helmet', 'boots', 'ring', 'companion']),
          itemId: z.string().max(60),
        }))
        .mutation(({ ctx, input }) => {
          return this.equipmentService.equip(ctx.userId, input.slot, input.itemId);
        }),
      unequip: protectedProcedure
        .input(z.object({
          slot: z.enum(['weapon', 'shield', 'armor', 'helmet', 'boots', 'ring', 'companion']),
        }))
        .mutation(({ ctx, input }) => {
          return this.equipmentService.unequip(ctx.userId, input.slot);
        }),
      attributes: protectedProcedure.query(({ ctx }) => {
        return this.equipmentService.computeAttributes(ctx.userId);
      }),
      forge: protectedProcedure
        .input(z.object({
          itemIds: z.tuple([z.string().max(60), z.string().max(60), z.string().max(60)]),
        }))
        .mutation(({ ctx, input }) => {
          return this.forgeService.forge(ctx.userId, input.itemIds);
        }),
    });

    // ─── Loot (Phase 5F) ─────────────────────────────────────────

    const lootRouter = router({
      roll: protectedProcedure
        .input(z.object({
          questRarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).default('common'),
          skillDomain: z.string().max(50).nullable().default(null),
        }))
        .mutation(({ ctx, input }) => {
          return this.lootService.rollLoot(ctx.userId, input.questRarity, input.skillDomain);
        }),
    });

    // ─── Shop (Phase 5F) ───────────────────────────────────────────

    const shopRouter = router({
      catalog: protectedProcedure.query(() => {
        return this.shopService.getCatalog();
      }),
      purchase: protectedProcedure
        .input(z.object({
          shopItemId: z.string().max(60),
        }))
        .mutation(({ ctx, input }) => {
          return this.shopService.purchase(ctx.userId, input.shopItemId);
        }),
    });

    // ─── Narrative & Lore (Phase P) ────────────────────────────

    const narrativeRouter = router({
      todayEpisode: protectedProcedure.query(({ ctx }) => {
        return this.narrativeService.getTodayEpisode(ctx.userId);
      }),
      markRead: protectedProcedure
        .input(z.object({
          episodeId: z.string().uuid(),
          source: z.enum(['home', 'archive', 'notification']),
          durationSec: z.number().int().min(0).optional(),
        }))
        .mutation(({ ctx, input }) => {
          return this.narrativeService.markEpisodeRead(
            ctx.userId, input.episodeId, input.source, input.durationSec,
          );
        }),
      dismiss: protectedProcedure
        .input(z.object({ episodeId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
          return this.narrativeService.dismissEpisode(ctx.userId, input.episodeId);
        }),
      preference: protectedProcedure.query(({ ctx }) => {
        return this.narrativeService.getNarrativePreference(ctx.userId);
      }),
      setMode: protectedProcedure
        .input(z.object({ mode: z.enum(['full', 'minimal', 'off']) }))
        .mutation(({ ctx, input }) => {
          return this.narrativeService.setNarrativeMode(ctx.userId, input.mode);
        }),
      seasons: protectedProcedure.query(() => {
        return this.narrativeService.getSeasons();
      }),
      seasonEpisodes: protectedProcedure
        .input(z.object({ seasonId: z.string().uuid() }))
        .query(({ ctx, input }) => {
          return this.narrativeService.getSeasonEpisodes(input.seasonId, ctx.userId);
        }),
      completeLegend: protectedProcedure.mutation(({ ctx }) => {
        return this.narrativeService.completeLegend(ctx.userId);
      }),
      // Admin endpoints
      reviewQueue: protectedProcedure.query(() => {
        return this.narrativeService.getReviewQueue();
      }),
      review: protectedProcedure
        .input(z.object({
          episodeId: z.string().uuid(),
          action: z.enum(['approve', 'reject']),
          edits: z.object({
            title: z.string().optional(),
            body: z.string().optional(),
            sageReflection: z.string().optional(),
          }).optional(),
        }))
        .mutation(({ input }) => {
          return this.narrativeService.reviewEpisode(
            input.episodeId, input.action, input.edits,
          );
        }),
      generateBatch: protectedProcedure
        .input(z.object({
          seasonId: z.string().uuid(),
          count: z.number().int().min(1).max(7),
        }))
        .mutation(({ input }) => {
          return this.narrativeService.generateEpisodeBatch(input.seasonId, input.count);
        }),
    });

    // ─── Assessment (Phase G) ──────────────────────────────────

    const assessmentRouter = router({
      generate: protectedProcedure
        .input(z.object({
          skillDomain: z.string().max(50),
          experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
          goal: z.string().max(500),
          questionCount: z.number().int().min(3).max(10).default(5),
        }))
        .mutation(({ ctx, input }) => {
          return this.assessmentService.generateAssessment(ctx.userId, input);
        }),
      submit: protectedProcedure
        .input(z.object({
          skillDomain: z.string().max(50),
          questions: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctIndex: z.number().int(),
            explanation: z.string(),
            bloomLevel: z.string(),
            skillDomain: z.string(),
            difficultyElo: z.number().int(),
            distractorTypes: z.array(z.string()),
          })),
          answers: z.array(z.object({
            questionIndex: z.number().int(),
            selectedIndex: z.number().int().min(0).max(3),
          })),
        }))
        .mutation(({ ctx, input }) => {
          return this.assessmentService.submitAssessment(
            ctx.userId,
            input.skillDomain,
            input.questions as any,
            input.answers,
          );
        }),
    });

    // ─── Admin AI Observability (Phase H) ────────────────────

    const adminRouter = router({
      llmCosts: protectedProcedure
        .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
        .query(({ input }) => {
          return this.adminAiService.getCostSummary(input.days);
        }),
      llmUsage: protectedProcedure
        .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
        .query(({ input }) => {
          return this.adminAiService.getUsageStats(input.days);
        }),
      llmErrors: protectedProcedure
        .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
        .query(({ input }) => {
          return this.adminAiService.getRecentErrors(input.limit);
        }),
      llmCacheStats: protectedProcedure.query(() => {
        return this.adminAiService.getCacheStats();
      }),
      llmTopUsers: protectedProcedure
        .input(z.object({
          days: z.number().int().min(1).max(90).default(30),
          limit: z.number().int().min(1).max(50).default(10),
        }))
        .query(({ input }) => {
          return this.adminAiService.getTopUsersByCost(input.days, input.limit);
        }),
    });

    // ─── Skill Elo (Phase J) ─────────────────────────────────

    const skillEloRouter = router({
      list: protectedProcedure.query(({ ctx }) => {
        return this.skillEloService.getAllElos(ctx.userId);
      }),
      get: protectedProcedure
        .input(z.object({ skillDomain: z.string().max(50) }))
        .query(({ ctx, input }) => {
          return this.skillEloService.getElo(ctx.userId, input.skillDomain);
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
        equipment: equipmentRouter,
        loot: lootRouter,
        shop: shopRouter,
        narrative: narrativeRouter,
        assessment: assessmentRouter,
        admin: adminRouter,
        skillElo: skillEloRouter,
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

import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CharacterModule } from '../character/character.module';
import { ProgressionModule } from '../progression/progression.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AiModule } from '../ai/ai.module';
import { QuestModule } from '../quest/quest.module';
import { SpacedRepetitionModule } from '../spaced-repetition/spaced-repetition.module';
import { AchievementModule } from '../achievement/achievement.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { LootModule } from '../loot/loot.module';
import { ForgeModule } from '../forge/forge.module';
import { ShopModule } from '../shop/shop.module';
import { NarrativeModule } from '../narrative/narrative.module';
import { AdminAiModule } from '../admin/admin-ai.module';
import { AssessmentModule } from '../assessment/assessment.module';
import { SkillEloModule } from '../skill-elo/skill-elo.module';
import { I18nModule } from '../i18n/i18n.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    AuthModule, UserModule, CharacterModule, ProgressionModule,
    RoadmapModule, AiModule, QuestModule,
    SpacedRepetitionModule, AchievementModule,
    EquipmentModule, LootModule, ForgeModule, ShopModule,
    NarrativeModule,
    AdminAiModule, AssessmentModule, SkillEloModule, I18nModule, OnboardingModule,
    SocialModule,
  ],
  providers: [TrpcService, TrpcRouter],
})
export class TrpcModule {}

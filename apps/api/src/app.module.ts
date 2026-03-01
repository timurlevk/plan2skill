import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CharacterModule } from './character/character.module';
import { ProgressionModule } from './progression/progression.module';
import { RoadmapModule } from './roadmap/roadmap.module';
import { AiModule } from './ai/ai.module';
import { QuestModule } from './quest/quest.module';
import { TrpcModule } from './trpc/trpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CharacterModule,
    ProgressionModule,
    RoadmapModule,
    AiModule,
    QuestModule,
    TrpcModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CharacterModule } from '../character/character.module';
import { ProgressionModule } from '../progression/progression.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AuthModule, UserModule, CharacterModule, ProgressionModule, RoadmapModule, AiModule],
  providers: [TrpcService, TrpcRouter],
})
export class TrpcModule {}

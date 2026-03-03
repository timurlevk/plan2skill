import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestGenerator } from '../ai/generators/quest.generator';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [QuestService, QuestGenerator],
  exports: [QuestService],
})
export class QuestModule {}

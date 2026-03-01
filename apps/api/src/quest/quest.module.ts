import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QuestService],
  exports: [QuestService],
})
export class QuestModule {}

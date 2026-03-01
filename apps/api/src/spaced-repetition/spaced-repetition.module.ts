import { Module } from '@nestjs/common';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SpacedRepetitionService],
  exports: [SpacedRepetitionService],
})
export class SpacedRepetitionModule {}

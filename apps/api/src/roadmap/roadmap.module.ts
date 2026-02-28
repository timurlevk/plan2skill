import { Module } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}

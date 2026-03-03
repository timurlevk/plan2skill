import { Module } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { AiModule } from '../ai/ai.module';
import { RoadmapGenerator } from '../ai/generators/roadmap.generator';

@Module({
  imports: [AiModule],
  providers: [RoadmapService, RoadmapGenerator],
  exports: [RoadmapService],
})
export class RoadmapModule {}

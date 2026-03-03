import { Module } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { RoadmapGateway } from './roadmap.gateway';
import { AiModule } from '../ai/ai.module';
import { RoadmapGenerator } from '../ai/generators/roadmap.generator';

@Module({
  imports: [AiModule],
  controllers: [RoadmapGateway],
  providers: [RoadmapService, RoadmapGenerator, RoadmapGateway],
  exports: [RoadmapService, RoadmapGateway],
})
export class RoadmapModule {}

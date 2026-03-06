import { Module } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { RoadmapGateway } from './roadmap.gateway';
import { AiModule } from '../ai/ai.module';
import { RoadmapGenerator } from '../ai/generators/roadmap.generator';
import { DomainClassifierService } from '../ai/generators/domain-classifier.service';

@Module({
  imports: [AiModule],
  controllers: [RoadmapGateway],
  providers: [RoadmapService, RoadmapGenerator, DomainClassifierService, RoadmapGateway],
  exports: [RoadmapService],
})
export class RoadmapModule {}

import { Module } from '@nestjs/common';
import { NarrativeService } from './narrative.service';
import { NarrativeSchedulerService } from './narrative-scheduler.service';
import { NarrativeGenerator } from '../ai/generators/narrative.generator';
import { AiModule } from '../ai/ai.module';
import { ProgressionModule } from '../progression/progression.module';

@Module({
  imports: [AiModule, ProgressionModule],
  providers: [NarrativeService, NarrativeGenerator, NarrativeSchedulerService],
  exports: [NarrativeService],
})
export class NarrativeModule {}

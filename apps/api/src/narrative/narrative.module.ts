import { Module } from '@nestjs/common';
import { NarrativeService } from './narrative.service';
import { NarrativeGenerator } from '../ai/generators/narrative.generator';
import { AiModule } from '../ai/ai.module';
import { ProgressionModule } from '../progression/progression.module';

@Module({
  imports: [AiModule, ProgressionModule],
  providers: [NarrativeService, NarrativeGenerator],
  exports: [NarrativeService],
})
export class NarrativeModule {}

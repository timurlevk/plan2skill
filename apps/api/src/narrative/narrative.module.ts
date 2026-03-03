import { Module } from '@nestjs/common';
import { NarrativeService } from './narrative.service';
import { AiModule } from '../ai/ai.module';
import { ProgressionModule } from '../progression/progression.module';

@Module({
  imports: [AiModule, ProgressionModule],
  providers: [NarrativeService],
  exports: [NarrativeService],
})
export class NarrativeModule {}

import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentGenerator } from '../ai/generators/assessment.generator';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [AssessmentService, AssessmentGenerator],
  exports: [AssessmentService],
})
export class AssessmentModule {}

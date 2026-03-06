import { Module } from '@nestjs/common';
import { OnboardingContentService } from './onboarding-content.service';
import { AiModule } from '../ai/ai.module';
import { MilestoneSuggestionGenerator } from '../ai/generators/milestone-suggestion.generator';
import { OnboardingAssessmentGenerator } from '../ai/generators/onboarding-assessment.generator';
import { InterestSuggestionGenerator } from '../ai/generators/interest-suggestion.generator';

@Module({
  imports: [AiModule],
  providers: [OnboardingContentService, MilestoneSuggestionGenerator, OnboardingAssessmentGenerator, InterestSuggestionGenerator],
  exports: [OnboardingContentService, MilestoneSuggestionGenerator, OnboardingAssessmentGenerator, InterestSuggestionGenerator],
})
export class OnboardingModule {}

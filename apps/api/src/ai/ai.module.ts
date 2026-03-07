import { Module } from '@nestjs/common';
import { LlmClient } from './core/llm-client';
import { LlmTracer } from './core/llm-tracer';
import { CacheService } from './core/cache.service';
import { ContextEnrichmentService } from './core/context-enrichment.service';
import { ContentSafetyService } from './core/content-safety.service';
import { AiRateLimitService } from './core/rate-limit.service';
import { TemplateService } from './core/template.service';
import { InsightGeneratorService } from './core/insight-generator.service';
import { LLM_CLIENT_TOKEN } from './core/interfaces';
import { CodeChallengeGenerator } from './generators/code-challenge.generator';
import { QuizGenerator } from './generators/quiz.generator';
import { RecommendationGenerator } from './generators/recommendation.generator';
import { FunFactGenerator } from './generators/fun-fact.generator';
import { ResourceGenerator } from './generators/resource.generator';
import { MotivationalGenerator } from './generators/motivational.generator';
import { DomainClassifierService } from './generators/domain-classifier.service';
import { ArticleBodyGenerator } from './generators/article-body.generator';
import { ExerciseGenerator } from './generators/exercise.generator';
import { ContentRouterService } from './core/content-router.service';
import { ContentBudgetService } from './core/content-budget.service';

@Module({
  providers: [
    { provide: LLM_CLIENT_TOKEN, useClass: LlmClient },
    LlmClient,
    LlmTracer,
    CacheService,
    ContextEnrichmentService,
    ContentSafetyService,
    AiRateLimitService,
    TemplateService,
    InsightGeneratorService,
    CodeChallengeGenerator,
    QuizGenerator,
    RecommendationGenerator,
    FunFactGenerator,
    ResourceGenerator,
    MotivationalGenerator,
    DomainClassifierService,
    ArticleBodyGenerator,
    ExerciseGenerator,
    ContentRouterService,
    ContentBudgetService,
  ],
  exports: [
    LLM_CLIENT_TOKEN,
    LlmClient,
    LlmTracer,
    CacheService,
    ContextEnrichmentService,
    ContentSafetyService,
    AiRateLimitService,
    TemplateService,
    InsightGeneratorService,
    CodeChallengeGenerator,
    QuizGenerator,
    RecommendationGenerator,
    FunFactGenerator,
    ResourceGenerator,
    MotivationalGenerator,
    DomainClassifierService,
    ArticleBodyGenerator,
    ExerciseGenerator,
    ContentRouterService,
    ContentBudgetService,
  ],
})
export class AiModule {}

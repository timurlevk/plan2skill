import { Module } from '@nestjs/common';
import { LlmClient } from './core/llm-client';
import { LlmTracer } from './core/llm-tracer';
import { CacheService } from './core/cache.service';
import { ContextEnrichmentService } from './core/context-enrichment.service';
import { ContentSafetyService } from './core/content-safety.service';
import { LLM_CLIENT_TOKEN } from './core/interfaces';

@Module({
  providers: [
    { provide: LLM_CLIENT_TOKEN, useClass: LlmClient },
    LlmClient,
    LlmTracer,
    CacheService,
    ContextEnrichmentService,
    ContentSafetyService,
  ],
  exports: [
    LLM_CLIENT_TOKEN,
    LlmClient,
    LlmTracer,
    CacheService,
    ContextEnrichmentService,
    ContentSafetyService,
  ],
})
export class AiModule {}

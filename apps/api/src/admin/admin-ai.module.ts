import { Module } from '@nestjs/common';
import { AdminAiService } from './admin-ai.service';

@Module({
  providers: [AdminAiService],
  exports: [AdminAiService],
})
export class AdminAiModule {}

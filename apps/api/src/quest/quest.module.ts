import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestContentService } from './quest-content.service';
import { QuestGenerator } from '../ai/generators/quest.generator';
import { QuestAssistantGenerator } from '../ai/generators/quest-assistant.generator';
import { ArticleBodyGenerator } from '../ai/generators/article-body.generator';
import { CodeChallengeGenerator } from '../ai/generators/code-challenge.generator';
import { MotivationalGenerator } from '../ai/generators/motivational.generator';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [
    QuestService,
    QuestContentService,
    QuestGenerator,
    QuestAssistantGenerator,
    ArticleBodyGenerator,
    CodeChallengeGenerator,
    MotivationalGenerator,
  ],
  exports: [QuestService, QuestContentService],
})
export class QuestModule {}

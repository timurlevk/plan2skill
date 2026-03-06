import { Module } from '@nestjs/common';
import { CharacterService } from './character.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [CharacterService],
  exports: [CharacterService],
})
export class CharacterModule {}

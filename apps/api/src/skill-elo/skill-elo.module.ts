import { Module } from '@nestjs/common';
import { SkillEloService } from './skill-elo.service';

@Module({
  providers: [SkillEloService],
  exports: [SkillEloService],
})
export class SkillEloModule {}

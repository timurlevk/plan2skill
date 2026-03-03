import { Module, forwardRef } from '@nestjs/common';
import { ProgressionService } from './progression.service';
import { LootModule } from '../loot/loot.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AchievementModule } from '../achievement/achievement.module';
import { CharacterModule } from '../character/character.module';
import { SkillEloModule } from '../skill-elo/skill-elo.module';

@Module({
  imports: [
    forwardRef(() => LootModule),
    forwardRef(() => RoadmapModule),
    forwardRef(() => AchievementModule),
    forwardRef(() => CharacterModule),
    SkillEloModule,
  ],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}

import { Module, forwardRef } from '@nestjs/common';
import { ProgressionService } from './progression.service';
import { LootModule } from '../loot/loot.module';
import { RoadmapModule } from '../roadmap/roadmap.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [
    forwardRef(() => LootModule),
    forwardRef(() => RoadmapModule),
    forwardRef(() => AchievementModule),
  ],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}

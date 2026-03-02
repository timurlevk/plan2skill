import { Module, forwardRef } from '@nestjs/common';
import { ProgressionService } from './progression.service';
import { LootModule } from '../loot/loot.module';

@Module({
  imports: [forwardRef(() => LootModule)],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}

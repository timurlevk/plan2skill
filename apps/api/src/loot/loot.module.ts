import { Module } from '@nestjs/common';
import { EquipmentModule } from '../equipment/equipment.module';
import { LootService } from './loot.service';

@Module({
  imports: [EquipmentModule],
  providers: [LootService],
  exports: [LootService],
})
export class LootModule {}

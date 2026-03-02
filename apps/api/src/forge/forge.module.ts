import { Module } from '@nestjs/common';
import { EquipmentModule } from '../equipment/equipment.module';
import { ForgeService } from './forge.service';

@Module({
  imports: [EquipmentModule],
  providers: [ForgeService],
  exports: [ForgeService],
})
export class ForgeModule {}

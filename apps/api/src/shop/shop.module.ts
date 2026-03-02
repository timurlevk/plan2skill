import { Module } from '@nestjs/common';
import { EquipmentModule } from '../equipment/equipment.module';
import { ShopService } from './shop.service';

@Module({
  imports: [EquipmentModule],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}

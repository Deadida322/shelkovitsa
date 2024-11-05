import { Module } from '@nestjs/common';
import { DeliveryTypeController } from './delivery-type.controller';
import { DeliveryTypeService } from './delivery-type.service';

@Module({
  controllers: [DeliveryTypeController],
  providers: [DeliveryTypeService]
})
export class DeliveryTypeModule {}

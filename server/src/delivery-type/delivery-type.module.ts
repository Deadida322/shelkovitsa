import { Module } from '@nestjs/common';
import { DeliveryTypeController } from './delivery-type.controller';
import { DeliveryTypeService } from './delivery-type.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryType } from 'src/db/entities/DeliveryType';

@Module({
	imports: [TypeOrmModule.forFeature([DeliveryType])],
	controllers: [DeliveryTypeController],
	providers: [DeliveryTypeService]
})
export class DeliveryTypeModule {}

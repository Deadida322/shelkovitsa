import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeliveryTypeService } from './delivery-type.service';
import { DeliveryTypeDto } from './dto/DeliveryTypeDto';

@ApiTags('Delivery Type')
@Controller('delivery-type')
export class DeliveryTypeController {
	constructor(private readonly deliveryTypeService: DeliveryTypeService) {}
	@Get()
	@ApiOperation({ summary: 'Получить список типов доставки' })
	@ApiResponse({ status: 200, description: 'Список типов доставки', type: [DeliveryTypeDto] })
	async getList(): Promise<DeliveryTypeDto[]> {
		return this.deliveryTypeService.getList();
	}
}

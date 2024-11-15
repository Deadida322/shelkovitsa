import { Controller, Get } from '@nestjs/common';
import { DeliveryTypeService } from './delivery-type.service';
import { DeliveryTypeDto } from './dto/DeliveryTypeDto';

@Controller('delivery-type')
export class DeliveryTypeController {
	constructor(private deliveryTypeService: DeliveryTypeService) {}
	@Get()
	async getList(): Promise<DeliveryTypeDto[]> {
		return this.deliveryTypeService.getList();
	}
}

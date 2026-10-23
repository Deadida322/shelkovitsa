import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { Repository } from 'typeorm';

@Injectable()
export class DeliveryTypeService {
	constructor(
		@InjectRepository(DeliveryType)
		private deliveryTypeRepository: Repository<DeliveryType>
	) {}

	async getList(): Promise<DeliveryType[]> {
		const deliveries = await this.deliveryTypeRepository.find({
			order: { id: 'ASC' }
		});

		return deliveries;
	}
}

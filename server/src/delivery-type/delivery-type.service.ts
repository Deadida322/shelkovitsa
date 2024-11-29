import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { Repository } from 'typeorm';
import { DeliveryTypeDto } from './dto/DeliveryTypeDto';
import { baseWhere } from 'src/common/utils';
import { convertToJsonMany } from 'src/helpers/convertHelper';

@Injectable()
export class DeliveryTypeService {
	constructor(
		@InjectRepository(DeliveryType)
		private deliveryTypeRepository: Repository<DeliveryType>
	) {}

	async getList(): Promise<DeliveryTypeDto[]> {
		const deliveries = await this.deliveryTypeRepository.find({
			where: {
				...baseWhere
			}
		});

		return convertToJsonMany(DeliveryTypeDto, deliveries);
	}
}

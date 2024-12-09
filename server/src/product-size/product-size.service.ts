import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { baseWhere } from 'src/common/utils';
import { ProductSize } from 'src/db/entities/ProductSize';
import { convertToJsonMany } from 'src/helpers/convertHelper';
import { Repository } from 'typeorm';
import { ProductSizeDto } from './dto/ProductSizeDto';
import { AdminProductSizeDto } from './dto/AdminProductSizeDto';

@Injectable()
export class ProductSizeService {
	constructor(
		@InjectRepository(ProductSize)
		private productSizeRepository: Repository<ProductSize>
	) {}

	async getList(isAdmin: boolean) {
		const wherePayload = isAdmin ? {} : { ...baseWhere };
		const sizes = await this.productSizeRepository.find({
			where: wherePayload
		});

		return convertToJsonMany(isAdmin ? AdminProductSizeDto : ProductSizeDto, sizes);
	}
}

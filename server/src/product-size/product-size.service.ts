import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSize } from 'src/db/entities/ProductSize';
import { convertToJsonMany } from 'src/helpers/convertHelper';
import { Repository } from 'typeorm';
import { ProductSizeDto } from './dto/ProductSizeDto';

@Injectable()
export class ProductSizeService {
	constructor(
		@InjectRepository(ProductSize)
		private productSizeRepository: Repository<ProductSize>
	) {}

	async getList() {
		const sizes = await this.productSizeRepository.find({ order: { name: 'ASC' } });
		return convertToJsonMany(ProductSizeDto, sizes);
	}
}

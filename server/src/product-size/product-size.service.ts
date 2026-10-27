import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductSize } from 'src/db/entities/ProductSize';
import { Repository } from 'typeorm';

@Injectable()
export class ProductSizeService {
	constructor(
		@InjectRepository(ProductSize)
		private productSizeRepository: Repository<ProductSize>
	) {}

	async getList() {
		return this.productSizeRepository.find({ order: { name: 'ASC' } });
	}
}

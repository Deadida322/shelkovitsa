import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { CreateProductColorDto } from './dto/CreateProductColorDto';

@Injectable()
export class ProductColorService {
	constructor(
		@InjectRepository(ProductColor)
		private readonly productColorRepository: Repository<ProductColor>
	) {}

	async getList(): Promise<ProductColor[]> {
		return this.productColorRepository.find({ order: { name: 'ASC' } });
	}

	async create(productColorDto: CreateProductColorDto): Promise<ProductColor> {
		const exists = await this.productColorRepository.exists({
			where: { name: productColorDto.name }
		});
		if (exists) {
			throw new BadRequestException('Данный цвет уже существует');
		}
		return this.productColorRepository.save({ ...productColorDto });
	}
}

import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';

@Controller('product')
export class ProductController {
	constructor(
		@InjectRepository(Product)
		private usersRepository: Repository<Product>
	) {}

	@Get(':id')
	getOne(@Param('id') id: number): Promise<Product> {
		const p = this.usersRepository.findOne({
			where: {
				id
			}
		});
		throw new BadRequestException('Продукт не найден');
	}

	@Get()
	getList(): Promise<Product[]> {
		return this.usersRepository.find();
	}
}

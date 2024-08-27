import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';
import { GetListDto } from '../common/dto/GetListDto';
import { convertToClass, convertToClassMany } from 'src/helpers/convertHelper';
import { ProductDto } from './dto/ProductDto';
import { FullProductDto } from './dto/FullProductDto';

@Controller('product')
export class ProductController {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>
	) {}

	@Get(':id')
	async getOne(@Param('id') id: number): Promise<FullProductDto> {
		const p = await this.productRepository.findOne({
			where: {
				id
			}
		});
		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		return convertToClass(FullProductDto, p);
	}

	@Post()
	async getList(@Body() getListDto: GetListDto): Promise<ProductDto[]> {
		const { itemsPerPage, page } = getListDto;
		const products = await this.productRepository.find({
			take: itemsPerPage,
			skip: itemsPerPage * page
		});

		return convertToClassMany(ProductDto, products);
	}
}

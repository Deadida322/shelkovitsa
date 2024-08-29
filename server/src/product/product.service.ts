import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';
import { FullProductDto } from './dto/FullProductDto';
import { convertToClass, convertToClassMany } from 'src/helpers/convertHelper';
import { GetListDto } from 'src/common/dto/GetListDto';
import { ProductDto } from './dto/ProductDto';

@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>,
		private configService: ConfigService
	) {}

	async getById(id: number) {
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

	async getList(getListDto: GetListDto): Promise<ProductDto[]> {
		const { itemsPerPage, page } = getListDto;

		const products = await this.productRepository.find({
			take: itemsPerPage,
			skip: itemsPerPage * page
		});

		return convertToClassMany(ProductDto, products);
	}
}

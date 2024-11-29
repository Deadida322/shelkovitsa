import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';
import { baseWhere } from 'src/common/utils';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { convertToJson } from 'src/helpers/convertHelper';

@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private productRepository: Repository<Product>
	) {}

	async getProduct({
		productArticleId,
		productColorId,
		productSizeId
	}: GetDetailProductDto) {
		const p = await this.productRepository.findOne({
			where: {
				...baseWhere,
				productArticle: {
					id: productArticleId,
					...baseWhere
				},
				productColor: {
					id: productColorId,
					...baseWhere
				},
				productSize: {
					id: productSizeId,
					...baseWhere
				}
			},
			relations: {
				productArticle: true
			}
		});

		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		return convertToJson(ProductDto, p);
	}
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { Repository } from 'typeorm';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { convertToJson } from 'src/helpers/convertHelper';
import { ProductAdminDto } from './dto/ProductAdminDto';

@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>
	) {}

	async getProduct(
		{ productArticleId, productColorId, productSizeId }: GetDetailProductDto,
		isAdmin: boolean = false
	) {
		// админ видит и неопубликованные артикулы
		const productArticlePayload = isAdmin
			? { id: productArticleId }
			: { id: productArticleId, isVisible: true };
		const p = await this.productRepository.findOne({
			where: {
				productArticle: productArticlePayload,
				productColor: { id: productColorId },
				productSize: { id: productSizeId }
			},
			relations: {
				productArticle: true
			}
		});

		if (!p) {
			throw new NotFoundException('Продукт не найден');
		}
		if (isAdmin) {
			return convertToJson(ProductAdminDto, p);
		}
		return convertToJson(ProductDto, p);
	}
}

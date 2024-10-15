import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { Repository } from 'typeorm';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { convertToJsonMany } from 'src/helpers/convertHelper';

@Injectable()
export class ProductCategoryService {
	constructor(
		@InjectRepository(ProductCategory)
		private productCategoryRepository: Repository<ProductCategory>
	) {}

	async getList(): Promise<ListProductCategoryDto[]> {
		const cats = await this.productCategoryRepository.find({
			select: {
				productSubcategories: true
			}
		});

		return convertToJsonMany(ListProductCategoryDto, cats);
	}
}

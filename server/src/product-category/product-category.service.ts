import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { Repository } from 'typeorm';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { convertToClassMany } from 'src/helpers/convertHelper';
import { Product } from 'src/db/entities/Product';
import { ProductDto } from 'src/product/dto/ProductDto';

@Injectable()
export class ProductCategoryService {
	constructor(
		@InjectRepository(ProductCategory)
		private productCategoryRepository: Repository<ProductCategory>,
		@InjectRepository(ProductSubcategory)
		private productSubcategoryRepository: Repository<ProductSubcategory>,
		@InjectRepository(Product)
		private productRepository: Repository<Product>
	) {}

	async getList(): Promise<ListProductCategoryDto[]> {
		const cats = await this.productCategoryRepository.find({
			select: {
				productSubcategories: true
			}
		});

		return convertToClassMany(ListProductCategoryDto, cats);
	}

	async geProductsByCategory(id: number): Promise<ProductDto[]> {
		const products = await this.productRepository.find({
			where: {
				productArticle: {
					productSubcategory: {
						productCategory: {
							id
						}
					}
				}
			}
		});

		return convertToClassMany(ProductDto, products);
	}
}

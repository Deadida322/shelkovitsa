import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { Repository } from 'typeorm';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { convertToClassMany } from 'src/helpers/convertHelper';
import { Product } from 'src/db/entities/Product';
import { ProductDto } from 'src/product/dto/ProductDto';
import { GetListDto } from 'src/common/dto/GetListDto';
import { getPaginate } from 'src/helpers/paginateHelper';

@Injectable()
export class ProductCategoryService {
	constructor(
		@InjectRepository(ProductCategory)
		private productCategoryRepository: Repository<ProductCategory>,
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

	async geProductsByCategory(
		id: number,
		getListDto: GetListDto
	): Promise<ProductDto[]> {
		const products = await this.productRepository.find({
			where: {
				productArticle: {
					productSubcategory: {
						productCategory: {
							id
						}
					}
				}
			},
			...getPaginate(getListDto)
		});

		return convertToClassMany(ProductDto, products);
	}

	async geProductsBySubcategory(
		id: number,
		getListDto: GetListDto
	): Promise<ProductDto[]> {
		const products = await this.productRepository.find({
			where: {
				productArticle: {
					productSubcategory: {
						id
					}
				}
			},
			...getPaginate(getListDto)
		});

		return convertToClassMany(ProductDto, products);
	}
}

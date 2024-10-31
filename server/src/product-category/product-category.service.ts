import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { Repository } from 'typeorm';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { convertToJson, convertToJsonMany } from 'src/helpers/convertHelper';
import { ProductCategoryDto } from './dto/ProductCategoryDto';
import { CreateProductCategoryDto } from './dto/CreateProductCategoryDto';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { CreateProductSubcategoryDto } from './dto/CreateProductSubcategoryDto';

@Injectable()
export class ProductCategoryService {
	constructor(
		@InjectRepository(ProductCategory)
		private productCategoryRepository: Repository<ProductCategory>,

		@InjectRepository(ProductSubcategory)
		private productSubcategoryRepository: Repository<ProductSubcategory>
	) {}

	async getList(): Promise<ListProductCategoryDto[]> {
		const cats = await this.productCategoryRepository.find({
			relations: {
				productSubcategories: true
			}
		});

		return convertToJsonMany(ListProductCategoryDto, cats);
	}

	async createCategory({
		name
	}: CreateProductCategoryDto): Promise<ProductCategoryDto> {
		const category = await this.productCategoryRepository.findOne({
			where: {
				name
			}
		});
		if (category) {
			throw new BadRequestException('Категория с таким названием уже существует!');
		}

		const newCategory = await this.productCategoryRepository.save({
			name
		});

		return convertToJson(ProductCategoryDto, newCategory);
	}

	async updateCategory({ id, name }: ProductCategoryDto): Promise<ProductCategoryDto> {
		const category = await this.productCategoryRepository.findOne({
			where: {
				id
			}
		});
		if (!category) {
			throw new BadRequestException('Нет такой категории!');
		}

		const updateCategory = await this.productCategoryRepository.save({
			id,
			name
		});

		return convertToJson(ProductCategoryDto, updateCategory);
	}

	async createSubCategory({
		categoryId,
		name
	}: CreateProductSubcategoryDto): Promise<ProductCategoryDto> {
		const category = await this.productCategoryRepository.findOne({
			where: {
				id: categoryId
			}
		});
		if (!category) {
			throw new BadRequestException('Такая категория не существует!');
		}

		const newSubcategory = await this.productSubcategoryRepository.save({
			name,
			productCategory: category
		});

		return convertToJson(ProductCategoryDto, newSubcategory);
	}
}

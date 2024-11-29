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
import { baseWhere } from 'src/common/utils';
import { UpdateProductSubcategoryDto } from './dto/UpdateProductSubcategoryDto';
import { ProductSubcategoryDto } from './dto/ProductSubcategoryDto';
import { BindProductArticleToSubcategoryDto } from './dto/BindProductArticleToSubcategoryDto';
import { ProductArticleDto } from 'src/product-article/dto/ProductArticleDto';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { FullProductArticleDto } from 'src/product-article/dto/FullProductArticleDto';

@Injectable()
export class ProductCategoryService {
	constructor(
		@InjectRepository(ProductCategory)
		private productCategoryRepository: Repository<ProductCategory>,

		@InjectRepository(ProductSubcategory)
		private productSubcategoryRepository: Repository<ProductSubcategory>,

		@InjectRepository(ProductArticle)
		private productArticleRepository: Repository<ProductArticle>
	) {}

	async getList(): Promise<ListProductCategoryDto[]> {
		const cats = await this.productCategoryRepository.find({
			where: {
				...baseWhere
			},
			relations: {
				productSubcategories: true
			}
		});

		return convertToJsonMany(ListProductCategoryDto, cats);
	}

	async createCategory({
		name
	}: CreateProductCategoryDto): Promise<ProductCategoryDto> {
		let category = await this.productCategoryRepository.findOne({
			where: {
				name
			}
		});
		if (category && !category.is_deleted) {
			throw new BadRequestException('Категория с таким названием уже существует!');
		} else if (category && category.is_deleted) {
			category = (
				await this.productCategoryRepository.update(category.id, {
					is_deleted: true
				})
			)[0];
		} else {
			category = await this.productCategoryRepository.save({
				name
			});
		}

		return convertToJson(ProductCategoryDto, category);
	}

	async updateCategory({ id, name }: ProductCategoryDto): Promise<ProductCategoryDto> {
		const category = await this.productCategoryRepository.findOne({
			where: {
				id,
				...baseWhere
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
	}: CreateProductSubcategoryDto): Promise<ProductSubcategoryDto> {
		const category = await this.productCategoryRepository.findOne({
			where: {
				id: categoryId,
				...baseWhere
			}
		});
		if (!category) {
			throw new BadRequestException('Такая категория не существует!');
		}

		let subcategory = await this.productSubcategoryRepository.findOne({
			where: {
				productCategory: category,
				name
			}
		});
		if (subcategory && !subcategory.is_deleted) {
			throw new BadRequestException('Такая подкатегория уже существует!');
		} else if (subcategory && subcategory.is_deleted) {
			subcategory = (
				await this.productSubcategoryRepository.update(subcategory.id, {
					is_deleted: false
				})
			)[0];
		} else {
			subcategory = await this.productSubcategoryRepository.save({
				name,
				productCategory: category
			});
		}

		return convertToJson(ProductSubcategoryDto, subcategory);
	}

	async updateSubCategory({
		categoryId,
		name,
		subcategoryId
	}: UpdateProductSubcategoryDto): Promise<ProductSubcategoryDto> {
		const category = await this.productCategoryRepository.findOne({
			where: {
				id: categoryId,
				...baseWhere
			}
		});
		if (!category) {
			throw new BadRequestException('Такая категория не существует!');
		}

		let subcategory = await this.productSubcategoryRepository.findOne({
			where: {
				id: subcategoryId,
				...baseWhere
			}
		});
		if (!subcategory) {
			throw new BadRequestException('Такая подкатегория не существует!');
		}

		const res = await this.productSubcategoryRepository.save({
			id: subcategoryId,
			is_deleted: false,
			name,
			productCategory: category
		});

		return convertToJson(ProductSubcategoryDto, res);
	}

	async bindProductToSubcategory({
		productArticleId,
		subcategoryId
	}: BindProductArticleToSubcategoryDto): Promise<FullProductArticleDto> {
		const productArticle = await this.productArticleRepository.findOne({
			where: {
				...baseWhere,
				id: productArticleId
			}
		});

		if (!productArticle) {
			throw new BadRequestException('Такого продукта не существует!');
		}

		let subcategory = await this.productSubcategoryRepository.findOne({
			where: {
				id: subcategoryId,
				...baseWhere
			}
		});
		if (!subcategory) {
			throw new BadRequestException('Такая подкатегория не существует!');
		}

		const res = await this.productArticleRepository.save({
			...productArticle,
			productSubcategory: subcategory
		});

		return convertToJson(FullProductArticleDto, res);
	}
}

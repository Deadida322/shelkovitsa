import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { convertToJson, convertToJsonMany } from 'src/helpers/convertHelper';
import { FullProductArticleDto } from 'src/product-article/dto/FullProductArticleDto';
import { BindProductArticleToSubcategoryDto } from './dto/BindProductArticleToSubcategoryDto';
import { CreateProductCategoryDto } from './dto/CreateProductCategoryDto';
import { CreateProductSubcategoryDto } from './dto/CreateProductSubcategoryDto';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductCategoryDto } from './dto/ProductCategoryDto';
import { ProductSubcategoryDto } from './dto/ProductSubcategoryDto';
import { UpdateProductSubcategoryDto } from './dto/UpdateProductSubcategoryDto';

// Категории и подкатегории удаляются физически: удалить можно только пустые,
// поэтому ссылок из заказов на них не бывает.
@Injectable()
export class ProductCategoryService {
	constructor(
		@InjectRepository(ProductCategory)
		private readonly productCategoryRepository: Repository<ProductCategory>,

		@InjectRepository(ProductSubcategory)
		private readonly productSubcategoryRepository: Repository<ProductSubcategory>,

		@InjectRepository(ProductArticle)
		private readonly productArticleRepository: Repository<ProductArticle>
	) {}

	async getList(): Promise<ListProductCategoryDto[]> {
		const categories = await this.productCategoryRepository.find({
			relations: { productSubcategories: true },
			order: { id: 'ASC', productSubcategories: { id: 'ASC' } }
		});
		return convertToJsonMany(ListProductCategoryDto, categories);
	}

	async createCategory({
		name
	}: CreateProductCategoryDto): Promise<ProductCategoryDto> {
		await this.assertCategoryNameFree(name);
		const category = await this.productCategoryRepository.save({ name });
		return convertToJson(ProductCategoryDto, category);
	}

	async updateCategory({ id, name }: ProductCategoryDto): Promise<ProductCategoryDto> {
		const category = await this.findCategory(id);
		await this.assertCategoryNameFree(name, id);
		category.name = name;
		return convertToJson(
			ProductCategoryDto,
			await this.productCategoryRepository.save(category)
		);
	}

	async deleteCategory(id: number): Promise<void> {
		await this.findCategory(id);
		const subcategories = await this.productSubcategoryRepository.count({
			where: { productCategory: { id } }
		});
		if (subcategories) {
			throw new BadRequestException('К категории еще привязаны подкатегории!');
		}
		await this.productCategoryRepository.delete(id);
	}

	async createSubCategory({
		categoryId,
		name
	}: CreateProductSubcategoryDto): Promise<ProductSubcategoryDto> {
		const category = await this.findCategory(categoryId);
		await this.assertSubcategoryNameFree(name);
		const subcategory = await this.productSubcategoryRepository.save({
			name,
			productCategory: category
		});
		return convertToJson(ProductSubcategoryDto, subcategory);
	}

	async updateSubCategory({
		categoryId,
		name,
		subcategoryId
	}: UpdateProductSubcategoryDto): Promise<ProductSubcategoryDto> {
		const category = await this.findCategory(categoryId);
		const subcategory = await this.findSubcategory(subcategoryId);
		await this.assertSubcategoryNameFree(name, subcategoryId);

		subcategory.name = name;
		subcategory.productCategory = category;
		return convertToJson(
			ProductSubcategoryDto,
			await this.productSubcategoryRepository.save(subcategory)
		);
	}

	async deleteSubcategory(id: number): Promise<void> {
		await this.findSubcategory(id);
		// товары в архиве тоже держат ссылку на подкатегорию
		const articles = await this.productArticleRepository.count({
			where: { productSubcategory: { id } },
			withDeleted: true
		});
		if (articles) {
			throw new BadRequestException('К подкатегории еще привязаны продукты!');
		}
		await this.productSubcategoryRepository.delete(id);
	}

	async bindProductToSubcategory({
		productArticleId,
		subcategoryId
	}: BindProductArticleToSubcategoryDto): Promise<FullProductArticleDto> {
		const productArticle = await this.productArticleRepository.findOne({
			where: { id: productArticleId }
		});
		if (!productArticle) {
			throw new NotFoundException('Такого продукта не существует!');
		}

		productArticle.productSubcategory = await this.findSubcategory(subcategoryId);
		return convertToJson(
			FullProductArticleDto,
			await this.productArticleRepository.save(productArticle)
		);
	}

	private async findCategory(id: number): Promise<ProductCategory> {
		const category = await this.productCategoryRepository.findOne({ where: { id } });
		if (!category) {
			throw new NotFoundException('Нет такой категории!');
		}
		return category;
	}

	private async findSubcategory(id: number): Promise<ProductSubcategory> {
		const subcategory = await this.productSubcategoryRepository.findOne({
			where: { id }
		});
		if (!subcategory) {
			throw new NotFoundException('Нет такой подкатегории!');
		}
		return subcategory;
	}

	private async assertCategoryNameFree(name: string, exceptId?: number) {
		const exists = await this.productCategoryRepository.exists({
			where: exceptId ? { name, id: Not(exceptId) } : { name }
		});
		if (exists) {
			throw new BadRequestException('Категория с таким названием уже существует!');
		}
	}

	// Имя подкатегории уникально глобально: импорт из Excel ищет её по имени
	private async assertSubcategoryNameFree(name: string, exceptId?: number) {
		const exists = await this.productSubcategoryRepository.exists({
			where: exceptId ? { name, id: Not(exceptId) } : { name }
		});
		if (exists) {
			throw new BadRequestException(
				'Подкатегория с таким названием уже существует!'
			);
		}
	}
}

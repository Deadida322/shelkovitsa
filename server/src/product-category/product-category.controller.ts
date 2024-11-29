import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductCategoryDto } from './dto/ProductCategoryDto';
import { CreateProductCategoryDto } from './dto/CreateProductCategoryDto';
import { CreateProductSubcategoryDto } from './dto/CreateProductSubcategoryDto';
import { AdminAuth } from 'src/decorators/adminAuth';
import { UpdateProductSubcategoryDto } from './dto/UpdateProductSubcategoryDto';
import { ProductSubcategoryDto } from './dto/ProductSubcategoryDto';
import { FullProductArticleDto } from 'src/product-article/dto/FullProductArticleDto';
import { BindProductArticleToSubcategoryDto } from './dto/BindProductArticleToSubcategoryDto';

@Controller('product-category')
export class ProductCategoryController {
	constructor(private productCategoryService: ProductCategoryService) {}
	@Get()
	async getList(): Promise<ListProductCategoryDto[]> {
		return this.productCategoryService.getList();
	}

	@Post('create')
	@AdminAuth()
	async create(@Body() payload: CreateProductCategoryDto): Promise<ProductCategoryDto> {
		return this.productCategoryService.createCategory(payload);
	}

	@Patch('update')
	@AdminAuth()
	async update(@Body() payload: ProductCategoryDto): Promise<ProductCategoryDto> {
		return this.productCategoryService.updateCategory(payload);
	}

	@Post('/subcategory/create')
	@AdminAuth()
	async createSubCategory(
		@Body() payload: CreateProductSubcategoryDto
	): Promise<ProductSubcategoryDto> {
		return this.productCategoryService.createSubCategory(payload);
	}

	@Patch('/subcategory/update')
	@AdminAuth()
	async updateSubCategory(
		@Body() payload: UpdateProductSubcategoryDto
	): Promise<ProductSubcategoryDto> {
		return this.productCategoryService.updateSubCategory(payload);
	}

	@Post('/subcategory/bindProduct')
	@AdminAuth()
	async bindProductToSubcategory(
		@Body() payload: BindProductArticleToSubcategoryDto
	): Promise<FullProductArticleDto> {
		return this.productCategoryService.bindProductToSubcategory(payload);
	}
}

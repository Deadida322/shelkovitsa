import {
	Body,
	Controller,
	Delete,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from 'src/decorators/adminAuth';
import { CreateProductCategoryDto } from './dto/CreateProductCategoryDto';
import { CreateProductSubcategoryDto } from './dto/CreateProductSubcategoryDto';
import { ProductCategoryDto } from './dto/ProductCategoryDto';
import { ProductSubcategoryDto } from './dto/ProductSubcategoryDto';
import { UpdateProductSubcategoryDto } from './dto/UpdateProductSubcategoryDto';
import { ProductCategoryService } from './product-category.service';

@ApiTags('Admin: Product Category')
@ApiCookieAuth('access_token')
@AdminAuth()
@Controller('admin')
export class ProductCategoryAdminController {
	constructor(private readonly productCategoryService: ProductCategoryService) {}

	@Post('product-category')
	async createCategory(
		@Body() payload: CreateProductCategoryDto
	): Promise<ProductCategoryDto> {
		return this.productCategoryService.createCategory(payload);
	}

	@Patch('product-category/:id')
	async updateCategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: CreateProductCategoryDto
	): Promise<ProductCategoryDto> {
		return this.productCategoryService.updateCategory(id, payload);
	}

	@Delete('product-category/:id')
	@HttpCode(204)
	async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.productCategoryService.deleteCategory(id);
	}

	@Post('product-category/:id/subcategories')
	async createSubcategory(
		@Param('id', ParseIntPipe) categoryId: number,
		@Body() payload: CreateProductSubcategoryDto
	): Promise<ProductSubcategoryDto> {
		return this.productCategoryService.createSubCategory(categoryId, payload);
	}

	@Patch('product-subcategory/:id')
	async updateSubcategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateProductSubcategoryDto
	): Promise<ProductSubcategoryDto> {
		return this.productCategoryService.updateSubCategory(id, payload);
	}

	@Delete('product-subcategory/:id')
	@HttpCode(204)
	async deleteSubcategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.productCategoryService.deleteSubcategory(id);
	}
}

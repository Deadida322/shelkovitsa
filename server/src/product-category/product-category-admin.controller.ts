import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	SerializeOptions
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from 'src/decorators/adminAuth';
import { CreateProductCategoryDto } from './dto/CreateProductCategoryDto';
import { CreateProductSubcategoryDto } from './dto/CreateProductSubcategoryDto';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
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

	@Get('product-category')
	@SerializeOptions({ type: ListProductCategoryDto })
	@ApiOperation({ summary: 'Все категории и подкатегории, включая пустые' })
	@ApiResponse({ status: 200, type: [ListProductCategoryDto] })
	async getList() {
		return this.productCategoryService.getList(true);
	}

	@SerializeOptions({ type: ProductCategoryDto })
	@Post('product-category')
	async createCategory(@Body() payload: CreateProductCategoryDto) {
		return this.productCategoryService.createCategory(payload);
	}

	@SerializeOptions({ type: ProductCategoryDto })
	@Patch('product-category/:id')
	async updateCategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: CreateProductCategoryDto
	) {
		return this.productCategoryService.updateCategory(id, payload);
	}

	@Delete('product-category/:id')
	@HttpCode(204)
	async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.productCategoryService.deleteCategory(id);
	}

	@SerializeOptions({ type: ProductSubcategoryDto })
	@Post('product-category/:id/subcategories')
	async createSubcategory(
		@Param('id', ParseIntPipe) categoryId: number,
		@Body() payload: CreateProductSubcategoryDto
	) {
		return this.productCategoryService.createSubCategory(categoryId, payload);
	}

	@SerializeOptions({ type: ProductSubcategoryDto })
	@Patch('product-subcategory/:id')
	async updateSubcategory(
		@Param('id', ParseIntPipe) id: number,
		@Body() payload: UpdateProductSubcategoryDto
	) {
		return this.productCategoryService.updateSubCategory(id, payload);
	}

	@Delete('product-subcategory/:id')
	@HttpCode(204)
	async deleteSubcategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
		await this.productCategoryService.deleteSubcategory(id);
	}
}

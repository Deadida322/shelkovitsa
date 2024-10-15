import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductDto } from 'src/product/dto/ProductDto';
import { GetListDto } from 'src/common/dto/GetListDto';

@Controller('product-category')
export class ProductCategoryController {
	constructor(private productCategoryService: ProductCategoryService) {}
	@Get()
	async getList(): Promise<ListProductCategoryDto[]> {
		return this.productCategoryService.getList();
	}

	@Post('/category/:id')
	async getProductByCategory(
		@Param('id') id: number,
		@Body() getListDto: GetListDto
	): Promise<ProductDto[]> {
		return this.productCategoryService.geProductsByCategory(id, getListDto);
	}

	@Post('/subcategory/:id')
	async getProductBySubcategory(
		@Param('id') id: number,
		@Body() getListDto: GetListDto
	): Promise<ProductDto[]> {
		return this.productCategoryService.geProductsBySubcategory(id, getListDto);
	}
}

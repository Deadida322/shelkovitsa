import { Controller, Get, Param } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductDto } from 'src/product/dto/ProductDto';

@Controller('product-category')
export class ProductCategoryController {
	constructor(private productCategoryService: ProductCategoryService) {}
	@Get()
	async getList(): Promise<ListProductCategoryDto[]> {
		return this.productCategoryService.getList();
	}

	@Get('/category/:id')
	async getProductByCategory(@Param('id') id: number): Promise<ProductDto[]> {
		return this.productCategoryService.geProductsByCategory(id);
	}
}

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductCategoryService } from './product-category.service';

@ApiTags('Product Category')
@Controller('product-category')
export class ProductCategoryController {
	constructor(private readonly productCategoryService: ProductCategoryService) {}

	@Get()
	@ApiOperation({ summary: 'Категории с подкатегориями' })
	@ApiResponse({ status: 200, type: [ListProductCategoryDto] })
	async getList(): Promise<ListProductCategoryDto[]> {
		return this.productCategoryService.getList();
	}
}

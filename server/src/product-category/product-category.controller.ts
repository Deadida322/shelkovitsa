import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListProductCategoryDto } from './dto/ListProductCategoryDto';
import { ProductCategoryService } from './product-category.service';

@ApiTags('Product Category')
@SerializeOptions({ type: ListProductCategoryDto })
@Controller('product-category')
export class ProductCategoryController {
	constructor(private readonly productCategoryService: ProductCategoryService) {}

	@Get()
	@ApiOperation({
		summary:
			'Публичные категории: только подкатегории с опубликованными товарами (одинаково для всех)'
	})
	@ApiResponse({ status: 200, type: [ListProductCategoryDto] })
	async getList() {
		return this.productCategoryService.getList(false);
	}
}

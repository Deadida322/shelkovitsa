import { Controller, Get, Req, SerializeOptions } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
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
			'Категории с подкатегориями: покупателю — только с опубликованными товарами, админу — все'
	})
	@ApiResponse({ status: 200, type: [ListProductCategoryDto] })
	async getList(@Req() request: Request) {
		return this.productCategoryService.getList(!!request.user?.isAdmin);
	}
}

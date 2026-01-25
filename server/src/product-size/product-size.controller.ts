import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductSizeService } from './product-size.service';
import { Request } from 'express';

@ApiTags('Product Size')
@Controller('product-size')
export class ProductSizeController {
	constructor(private readonly productSizeService: ProductSizeService) {}

	@Get()
	@ApiOperation({ summary: 'Получить список размеров продуктов' })
	@ApiResponse({ status: 200, description: 'Список размеров' })
	async getProductSizes(@Req() request: Request) {
		return this.productSizeService.getList(request.isAdmin);
	}
}

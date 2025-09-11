import { Controller, Get, Req } from '@nestjs/common';
import { ProductSizeService } from './product-size.service';
import { Request } from 'express';

@Controller('product-size')
export class ProductSizeController {
	constructor(private readonly productSizeService: ProductSizeService) {}

	@Get()
	async getProductSizes(@Req() request: Request) {
		return this.productSizeService.getList(request.isAdmin);
	}
}

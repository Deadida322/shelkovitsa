import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from 'src/decorators/adminAuth';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { ProductService } from './product.service';

@ApiTags('Admin: Product')
@ApiCookieAuth('access_token')
@AdminAuth()
@Controller('admin/product')
export class ProductAdminController {
	constructor(private readonly productService: ProductService) {}

	@Get()
	@ApiOperation({ summary: 'Вариант товара, в том числе у неопубликованного артикула' })
	async getVariant(@Query() query: GetDetailProductDto): Promise<ProductDto> {
		return this.productService.getProduct(query, true);
	}
}

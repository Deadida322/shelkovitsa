import { ProductAdminDto } from './dto/ProductAdminDto';
import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from 'src/decorators/adminAuth';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductService } from './product.service';

@ApiTags('Admin: Product')
@ApiCookieAuth('access_token')
@AdminAuth()
@SerializeOptions({ type: ProductAdminDto })
@Controller('admin/product')
export class ProductAdminController {
	constructor(private readonly productService: ProductService) {}

	@Get()
	@ApiOperation({ summary: 'Вариант товара, в том числе у неопубликованного артикула' })
	async getVariant(@Query() query: GetDetailProductDto) {
		return this.productService.getProduct(query, true);
	}
}

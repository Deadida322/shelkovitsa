import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { ProductService } from './product.service';

@ApiTags('Product')
@SerializeOptions({ type: ProductDto })
@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Get()
	@ApiOperation({ summary: 'Вариант товара (артикул + цвет + размер) с остатком' })
	@ApiResponse({ status: 200, type: ProductDto })
	async getVariant(@Query() query: GetDetailProductDto) {
		return this.productService.getProduct(query);
	}
}

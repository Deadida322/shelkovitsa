import { Body, Controller, Post } from '@nestjs/common';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
	constructor(private productService: ProductService) {}

	@Post('get')
	async getProduct(@Body() payload: GetDetailProductDto): Promise<ProductDto> {
		return this.productService.getProduct(payload);
	}
}

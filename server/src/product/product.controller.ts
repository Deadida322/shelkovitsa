import { Body, Controller, Post } from '@nestjs/common';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { ProductService } from './product.service';
import { AdminAuth } from 'src/decorators/adminAuth';

@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Post('get')
	async getProduct(@Body() payload: GetDetailProductDto): Promise<ProductDto> {
		return this.productService.getProduct(payload);
	}

	@AdminAuth()
	@Post('admin/get')
	async getProductAdmin(@Body() payload: GetDetailProductDto): Promise<ProductDto> {
		return this.productService.getProduct(payload, true);
	}
}

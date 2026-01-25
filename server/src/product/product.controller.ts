import { Body, Controller, Post } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiCookieAuth,
	ApiBody
} from '@nestjs/swagger';
import { GetDetailProductDto } from './dto/GetDetailProductDto';
import { ProductDto } from './dto/ProductDto';
import { ProductService } from './product.service';
import { AdminAuth } from 'src/decorators/adminAuth';

@ApiTags('Product')
@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Post('get')
	@ApiOperation({ summary: 'Получить информацию о продукте' })
	@ApiResponse({ status: 200, description: 'Информация о продукте', type: ProductDto })
	@ApiBody({ type: GetDetailProductDto })
	async getProduct(@Body() payload: GetDetailProductDto): Promise<ProductDto> {
		return this.productService.getProduct(payload);
	}

	@AdminAuth()
	@Post('admin/get')
	@ApiOperation({ summary: 'Получить информацию о продукте (админ)' })
	@ApiBearerAuth('JWT-auth')
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Информация о продукте', type: ProductDto })
	@ApiBody({ type: GetDetailProductDto })
	async getProductAdmin(@Body() payload: GetDetailProductDto): Promise<ProductDto> {
		return this.productService.getProduct(payload, true);
	}
}

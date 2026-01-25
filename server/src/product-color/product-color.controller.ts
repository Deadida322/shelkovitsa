import { Body, Controller, Get, Post } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiCookieAuth,
	ApiBody
} from '@nestjs/swagger';
import { ProductColorService } from './product-color.service';
import { ProductColorDto } from 'src/product-color/dto/ProductColorDto';
import { CreateProductColorDto } from './dto/CreateProductColorDto';
import { AdminAuth } from 'src/decorators/adminAuth';

@ApiTags('Product Color')
@Controller('product-color')
export class ProductColorController {
	constructor(private readonly productService: ProductColorService) {}

	@Get()
	@ApiOperation({ summary: 'Получить список цветов продуктов' })
	@ApiResponse({ status: 200, description: 'Список цветов', type: [ProductColorDto] })
	async getList(): Promise<ProductColorDto[]> {
		return this.productService.getList();
	}

	@Post('create')
	@AdminAuth()
	@ApiOperation({ summary: 'Создать цвет продукта (админ)' })
	@ApiBearerAuth('JWT-auth')
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 201, description: 'Цвет создан', type: ProductColorDto })
	@ApiBody({ type: CreateProductColorDto })
	async create(@Body() payload: CreateProductColorDto): Promise<ProductColorDto> {
		return this.productService.create(payload);
	}
}

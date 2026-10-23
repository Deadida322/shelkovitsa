import { Body, Controller, Get, Post, SerializeOptions } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from 'src/decorators/adminAuth';
import { CreateProductColorDto } from './dto/CreateProductColorDto';
import { ProductColorDto } from './dto/ProductColorDto';
import { ProductColorService } from './product-color.service';

@ApiTags('Product Color')
@SerializeOptions({ type: ProductColorDto })
@Controller('product-color')
export class ProductColorController {
	constructor(private readonly productColorService: ProductColorService) {}

	@Get()
	@ApiOperation({ summary: 'Справочник цветов' })
	@ApiResponse({ status: 200, type: [ProductColorDto] })
	async getList() {
		return this.productColorService.getList();
	}
}

@ApiTags('Admin: Product Color')
@ApiCookieAuth('access_token')
@AdminAuth()
@SerializeOptions({ type: ProductColorDto })
@Controller('admin/product-color')
export class ProductColorAdminController {
	constructor(private readonly productColorService: ProductColorService) {}

	@Post()
	async create(@Body() payload: CreateProductColorDto) {
		return this.productColorService.create(payload);
	}
}

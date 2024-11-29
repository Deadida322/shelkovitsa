import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductColorService } from './product-color.service';
import { ProductColorDto } from 'src/product-color/dto/ProductColorDto';
import { CreateProductColorDto } from './dto/CreateProductColorDto';
import { AdminAuth } from 'src/decorators/adminAuth';

@Controller('product-color')
export class ProductColorController {
	constructor(private productService: ProductColorService) {}

	@Get()
	async getList(): Promise<ProductColorDto[]> {
		return this.productService.getList();
	}

	@Post('create')
	@AdminAuth()
	async create(@Body() payload: CreateProductColorDto): Promise<ProductColorDto> {
		return this.productService.create(payload);
	}
}

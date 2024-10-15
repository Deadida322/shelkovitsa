import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductColorService } from './product-color.service';
import { ProductCategoryDto } from 'src/product-category/dto/ProductCategoryDto';
import { ProductColorDto } from 'src/product/dto/ProductColorDto';
import { CreateProductColorDto } from './dto/CreateProductColorDto';

@Controller('product-color')
export class ProductColorController {
	constructor(private productService: ProductColorService) {}

	@Get()
	async getList(): Promise<ProductColorDto[]> {
		return this.productService.getList();
	}

	@Post('create')
	async create(@Body() payload: CreateProductColorDto): Promise<ProductColorDto> {
		return this.productService.create(payload);
	}
}

import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';
import { ProductFileDto } from './ProductFileDto';
import { ProductSizeDto } from '../../product-size/dto/ProductSizeDto';
import { ProductColorDto } from '../../product-color/dto/ProductColorDto';
import { ProductSubcategoryDto } from 'src/product-category/dto/ProductSubcategoryDto';

export class FullProductArticleDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	description?: string;

	@Expose()
	logo?: string;

	@Expose()
	article!: string;

	@Expose()
	price!: number;

	@Expose()
	@Type(() => ProductFileDto)
	productFiles?: ProductFileDto[];

	@Expose()
	@Type(() => ProductSizeDto)
	productSizes?: ProductSizeDto[];

	@Expose()
	@Type(() => ProductColorDto)
	productColors?: ProductColorDto[];

	@Expose()
	@Type(() => ProductSubcategoryDto)
	productSubcategory: ProductSubcategoryDto;
}

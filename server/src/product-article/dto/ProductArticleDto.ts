import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';
import { ProductFileDto } from './ProductFileDto';
import { ProductSubcategoryDto } from 'src/product-category/dto/ProductSubcategoryDto';

export class ProductArticleDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	description?: string;

	@Expose()
	article!: string;

	@Expose()
	price!: number;

	@Expose()
	@Type(() => ProductFileDto)
	productFiles?: ProductFileDto[];

	@Expose()
	@Type(() => ProductSubcategoryDto)
	productSubcategory: ProductSubcategoryDto;
}

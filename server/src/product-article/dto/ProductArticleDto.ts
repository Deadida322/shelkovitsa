import { Expose, Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { ProductFileDto } from './ProductFileDto';
import { ProductSubcategoryDto } from 'src/product-category/dto/ProductSubcategoryDto';

export class ProductArticleDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	country?: string;

	@Expose()
	description?: string;

	@Expose()
	brand?: string;

	@Expose()
	composition?: string;

	@Expose()
	article!: string;

	/** Цена в копейках */
	@Expose()
	@Transform(({ value }) => (value == null ? value : Number(value)))
	price!: number;

	@Expose()
	@Type(() => ProductFileDto)
	productFiles?: ProductFileDto[];

	@Expose()
	@Type(() => ProductSubcategoryDto)
	productSubcategory: ProductSubcategoryDto;
}

import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';

export class CreateProductDto {
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
	productSizeIds: number[];

	@Expose()
	productColorIds: number[];

	@Expose()
	productSubcategoryId: number;
}

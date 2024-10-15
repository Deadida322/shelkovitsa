import { Expose, Type } from 'class-transformer';

export class ProductCategoryDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;
}

import { Expose, Type } from 'class-transformer';
import { ProductCategoryDto } from './ProductCategoryDto';

export class ProductSubcategoryDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	@Type(() => ProductCategoryDto)
	productCategory: ProductCategoryDto;
}

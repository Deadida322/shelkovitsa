import { Expose, Type } from 'class-transformer';
import { ProductSubcategoryDto } from './ProductSubcategoryDto';

export class ListProductCategoryDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	@Type(() => ProductSubcategoryDto)
	productSubcategories: ProductSubcategoryDto[];
}

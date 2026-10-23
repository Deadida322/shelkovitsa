import { Expose } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { CreateProductSubcategoryDto } from './CreateProductSubcategoryDto';

export class UpdateProductSubcategoryDto extends CreateProductSubcategoryDto {
	// перенос подкатегории в другую категорию
	@IsOptional()
	@IsInt({
		message: 'categoryId должен быть числом'
	})
	@Expose()
	categoryId?: number;
}

import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { CreateProductSubcategoryDto } from './CreateProductSubcategoryDto';

export class UpdateProductSubcategoryDto extends CreateProductSubcategoryDto {
	@IsNotEmpty()
	@IsInt({
		message: 'subcategoryId должен быть числом'
	})
	@Expose()
	subcategoryId!: number;
}

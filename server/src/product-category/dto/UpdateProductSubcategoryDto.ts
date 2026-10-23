import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateProductSubcategoryDto } from './CreateProductSubcategoryDto';

export class UpdateProductSubcategoryDto extends CreateProductSubcategoryDto {
	@IsNotEmpty()
	@IsInt({
		message: 'subcategoryId должен быть числом'
	})
	@Expose()
	subcategoryId!: number;
}

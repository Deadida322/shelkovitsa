import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateProductSubcategoryDto {
	@IsNotEmpty()
	@IsInt({
		message: 'categoryId должен быть числом'
	})
	@Expose()
	categoryId!: number;

	@IsNotEmpty()
	@IsString({
		message: 'Имя должно быть строкой'
	})
	@Expose()
	name: string;
}

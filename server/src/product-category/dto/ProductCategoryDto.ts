import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ProductCategoryDto {
	@IsNotEmpty()
	@IsInt({
		message: 'id должен быть числом'
	})
	@Expose()
	id!: number;

	@IsNotEmpty()
	@IsString({
		message: 'Имя должно быть строкой'
	})
	@Expose()
	name!: string;
}

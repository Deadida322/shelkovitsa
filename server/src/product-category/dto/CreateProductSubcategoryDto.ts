import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductSubcategoryDto {
	@IsNotEmpty()
	@IsString({
		message: 'Имя должно быть строкой'
	})
	@Expose()
	name: string;
}

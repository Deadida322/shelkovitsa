import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductCategoryDto {
	@IsNotEmpty()
	@IsString({
		message: 'Имя должно быть строкой'
	})
	@Expose()
	name: string;
}

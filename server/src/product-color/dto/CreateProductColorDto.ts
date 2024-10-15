import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateProductColorDto {
	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не заполнено'
	})
	name!: string;
}

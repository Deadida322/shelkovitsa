import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import 'reflect-metadata';

export class GetDetailProductDto {
	@Expose()
	@IsNotEmpty()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productColorId: number;

	@Expose()
	@IsNotEmpty()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productSizeId: number;

	@Expose()
	@IsNotEmpty()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productArticleId: number;
}

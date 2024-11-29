import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import 'reflect-metadata';

export class GetDetailProductArticleDto {
	@Expose()
	@IsOptional()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productColorId: number;

	@Expose()
	@IsOptional()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productSizeId: number;
}

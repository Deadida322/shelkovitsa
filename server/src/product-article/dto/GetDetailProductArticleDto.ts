import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import 'reflect-metadata';

export class GetDetailProductArticleDto {
	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productColorId: number;

	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productSizeId: number;
}

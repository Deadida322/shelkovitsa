import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import 'reflect-metadata';

/** Область, для которой считаются значения фильтров (как в списке каталога) */
export class GetProductArticleFiltersDto {
	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	categoryId: number;

	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	subcategoryId: number;

	@Expose()
	@IsOptional()
	@IsString()
	query: string;
}

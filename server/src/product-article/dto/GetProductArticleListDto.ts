import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import 'reflect-metadata';
import { GetListDto } from 'src/common/dto/GetListDto';

export class GetProductArticleListDto extends GetListDto {
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
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	minPrice: number;

	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	maxPrice: number;

	/** Фильтр по id размера: артикулы, у которых есть вариант этого размера */
	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productSizeId: number;

	/** Фильтр по торговой марке (точное совпадение без учёта регистра) */
	@Expose()
	@IsOptional()
	@IsString()
	brand: string;

	@Expose()
	@IsOptional()
	@IsString()
	query: string;
}

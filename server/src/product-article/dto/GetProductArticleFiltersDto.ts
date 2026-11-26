import { Expose, Transform, Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	Min
} from 'class-validator';
import 'reflect-metadata';

// ?a=1&a=2 приходит массивом, ?a=1 — строкой
const toArray = (value: unknown): unknown[] | undefined => {
	if (value === undefined || value === null || value === '') return undefined;
	return (Array.isArray(value) ? value : [value]).filter((v) => v !== '');
};

const toBoolean = (value: unknown) => value === true || value === 'true' || value === '1';

/**
 * Область для значений фильтров. Счётчики учитывают пересечение:
 * бренды — без учёта выбранных брендов, размеры — без учёта выбранных размеров,
 * чтобы можно было сузить и снять фильтр.
 */
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

	@Expose()
	@IsOptional()
	@Transform(({ value }) => toArray(value))
	@IsArray()
	@ArrayMaxSize(50)
	@IsString({ each: true })
	brand: string[];

	@Expose()
	@IsOptional()
	@Transform(({ value }) => toArray(value)?.map(Number))
	@IsArray()
	@ArrayMaxSize(50)
	@IsInt({ each: true })
	@Min(0, { each: true, message: 'Должно быть >= 0' })
	productSizeId: number[];

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

	@Expose()
	@IsOptional()
	@Transform(({ value }) => toBoolean(value))
	@IsBoolean()
	inStock: boolean;
}

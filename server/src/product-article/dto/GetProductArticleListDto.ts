import { Expose, Transform, Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Min
} from 'class-validator';
import 'reflect-metadata';
import { GetListDto } from 'src/common/dto/GetListDto';

// ?a=1&a=2 приходит массивом, ?a=1 — строкой: приводим к массиву, пустое значение — «не задано»
const toArray = (value: unknown): unknown[] | undefined => {
	if (value === undefined || value === null || value === '') return undefined;
	return (Array.isArray(value) ? value : [value]).filter((v) => v !== '');
};

const toBoolean = (value: unknown) => value === true || value === 'true' || value === '1';

export const PRODUCT_SORTS = ['default', 'new', 'priceAsc', 'priceDesc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const ADMIN_PRODUCT_STATUSES = ['published', 'hidden', 'archive'] as const;
export type AdminProductStatus = (typeof ADMIN_PRODUCT_STATUSES)[number];

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

	/**
	 * Размеры (повторяющийся параметр): артикулы, у которых есть вариант
	 * любого из этих размеров в наличии
	 */
	@Expose()
	@IsOptional()
	@Transform(({ value }) => toArray(value)?.map(Number))
	@IsArray()
	@ArrayMaxSize(50)
	@IsInt({ each: true })
	@Min(0, { each: true, message: 'Должно быть >= 0' })
	productSizeId: number[];

	/** Торговые марки (повторяющийся параметр, без учёта регистра) */
	@Expose()
	@IsOptional()
	@Transform(({ value }) => toArray(value))
	@IsArray()
	@ArrayMaxSize(50)
	@IsString({ each: true })
	brand: string[];

	/** Только артикулы, у которых есть хотя бы один вариант в наличии */
	@Expose()
	@IsOptional()
	@Transform(({ value }) => toBoolean(value))
	@IsBoolean()
	inStock: boolean;

	@Expose()
	@IsOptional()
	@IsIn(PRODUCT_SORTS)
	sort: ProductSort;

	/** Поиск по артикулу, названию, описанию и бренду */
	@Expose()
	@IsOptional()
	@IsString()
	query: string;

	// ——— только админка (в публичном каталоге игнорируются) ———

	/** published — опубликованные, hidden — скрытые, archive — в архиве */
	@Expose()
	@IsOptional()
	@IsIn(ADMIN_PRODUCT_STATUSES)
	status: AdminProductStatus;

	/** Артикулы без единого фото */
	@Expose()
	@IsOptional()
	@Transform(({ value }) => toBoolean(value))
	@IsBoolean()
	noImage: boolean;

	/** Артикулы, у которых нет ни одного варианта в наличии */
	@Expose()
	@IsOptional()
	@Transform(({ value }) => toBoolean(value))
	@IsBoolean()
	noStock: boolean;
}

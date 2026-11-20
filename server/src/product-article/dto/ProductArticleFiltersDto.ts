import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';

export class FilterBrandDto {
	@Expose()
	name!: string;

	/** Сколько артикулов этого бренда в выбранной области */
	@Expose()
	count!: number;
}

export class FilterSizeDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	/** Сколько артикулов с этим размером в наличии */
	@Expose()
	count!: number;
}

export class FilterPriceDto {
	@Expose()
	min!: number;

	@Expose()
	max!: number;
}

/** Значения для панели фильтров каталога */
export class ProductArticleFiltersDto {
	@Expose()
	@Type(() => FilterBrandDto)
	brands!: FilterBrandDto[];

	@Expose()
	@Type(() => FilterSizeDto)
	sizes!: FilterSizeDto[];

	@Expose()
	@Type(() => FilterPriceDto)
	price!: FilterPriceDto;
}

import { Expose, Type } from 'class-transformer';
import {
	IsInt,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	MaxLength
} from 'class-validator';

// Позиция корзины в том виде, в каком её хранит фронт (вместе с полями для отображения)
export class BasketItemDto {
	@Expose()
	@IsInt()
	@IsPositive()
	productId: number;

	@Expose()
	@IsInt()
	@IsPositive()
	amount: number;

	// id артикула: фронт берёт его из URL, поэтому может прийти строкой
	@Expose()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	id?: number;

	@Expose()
	@IsOptional()
	@IsInt()
	productSizeId?: number;

	@Expose()
	@IsOptional()
	@IsInt()
	productColorId?: number;

	@Expose()
	@IsOptional()
	@IsString()
	@MaxLength(500)
	name?: string;

	@Expose()
	@IsOptional()
	@IsNumber()
	price?: number;

	@Expose()
	@IsOptional()
	@IsInt()
	maxAmount?: number;

	@Expose()
	@IsOptional()
	@IsString()
	@MaxLength(500)
	logo?: string;
}

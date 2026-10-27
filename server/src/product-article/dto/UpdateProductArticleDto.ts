import { Expose } from 'class-transformer';
import {
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	IsArray,
	ArrayUnique
} from 'class-validator';

import 'reflect-metadata';

export class UpdateProductArticleDto {
	// перенос в другую подкатегорию
	@IsOptional()
	@IsInt()
	@Expose()
	productSubcategoryId?: number;

	@IsOptional()
	@IsString()
	@Expose()
	name?: string;

	@IsOptional()
	@IsString()
	@Expose()
	description?: string;

	@IsOptional()
	@IsBoolean()
	@Expose()
	isVisible?: boolean;

	@IsOptional()
	@IsBoolean()
	@Expose()
	is_deleted?: boolean;

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsInt({ each: true })
	@Expose()
	productColorIds?: number[];

	@IsOptional()
	@ArrayUnique()
	@IsArray()
	@IsInt({ each: true })
	@Expose()
	productSizeIds?: number[];
}

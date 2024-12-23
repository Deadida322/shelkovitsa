import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import 'reflect-metadata';

export class UpdateProductArticleDto {
	@IsNotEmpty()
	@IsInt()
	@Expose()
	id: number;

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
}

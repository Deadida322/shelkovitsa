import { Expose, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import 'reflect-metadata';

export class CreateProductDto {
	@IsNotEmpty()
	@IsString()
	@Expose()
	name!: string;

	@IsOptional()
	@IsString()
	@Expose()
	description?: string;

	@IsString()
	@Expose()
	logo?: string;

	@IsString()
	@IsNotEmpty()
	@Expose()
	article!: string;

	@IsNumber()
	@IsNotEmpty()
	@Expose()
	price!: number;

	@IsArray({
		each: true
	})
	@Expose()
	productSizeIds: number[];

	@IsArray({
		each: true
	})
	@Expose()
	productColorIds: number[];

	@IsNumber()
	@Expose()
	productSubcategoryId?: number;
}

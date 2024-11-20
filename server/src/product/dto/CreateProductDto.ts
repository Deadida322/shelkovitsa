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
	@IsNotEmpty()
	@Expose()
	article!: string;

	@IsNumber()
	@IsNotEmpty()
	@Expose()
	price!: number;

	@IsOptional()
	@IsArray({
		each: true
	})
	@Expose()
	productSizeIds?: number[];

	@IsArray({
		each: true
	})
	@Expose()
	productColorIds?: number[];

	@IsOptional()
	@IsNumber()
	@Expose()
	productSubcategoryId?: number;
}

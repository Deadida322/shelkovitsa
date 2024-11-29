import { Expose, Type } from 'class-transformer';
import {
	IsArray,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsNumberString,
	IsOptional,
	IsString
} from 'class-validator';
import {
	HasMimeType,
	IsFile,
	IsFiles,
	MaxFileSize,
	MemoryStoredFile
} from 'nestjs-form-data';
import 'reflect-metadata';

export class CreateProductArticleDto {
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

	@Type(() => Number)
	@IsInt()
	@IsNotEmpty()
	@Expose()
	price!: number;

	@IsOptional()
	@IsArray({
		each: true
	})
	@Expose()
	productSizeIds?: number[];

	@IsOptional()
	@IsArray({
		each: true
	})
	@Expose()
	productColorIds?: number[];

	@IsOptional()
	@IsNumber()
	@Expose()
	productSubcategoryId?: number;

	// @MaxFileSize(1e6, { each: true })
	// @HasMimeType(['image/*'], {
	// 	each: true
	// })
	@IsOptional({ each: true })
	@IsOptional()
	@IsFiles()
	// @Type(() => MemoryStoredFile)
	images?: MemoryStoredFile[];

	// @IsFiles()
	// @MaxFileSize(1e6, { each: true })
	// @HasMimeType(['image/*'], {
	// 	each: true
	// })
	// images: MemoryStoredFile[];
}

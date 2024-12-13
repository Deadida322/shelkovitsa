import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumberString, Min } from 'class-validator';
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
import 'reflect-metadata';

export class UploadImageDto {
	@MaxFileSize(1e6)
	@HasMimeType(['image/*'])
	@IsNotEmpty()
	@IsFile()
	image: MemoryStoredFile;

	@Expose()
	@IsNumberString()
	@IsNotEmpty()
	productArticleId: number;
}

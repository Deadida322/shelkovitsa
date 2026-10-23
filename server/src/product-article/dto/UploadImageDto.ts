import { IsNotEmpty } from 'class-validator';
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from 'nestjs-form-data';
import 'reflect-metadata';

export class UploadImageDto {
	@MaxFileSize(5e6)
	@HasMimeType(['image/jpeg', 'image/png', 'image/webp'])
	@IsNotEmpty()
	@IsFile()
	image: MemoryStoredFile;
}

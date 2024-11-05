import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import 'reflect-metadata';

export class UploadFileDto {
	@IsOptional()
	@Expose()
	@IsBoolean({
		message: 'Неправильный формат поля'
	})
	isDeletedOther?: boolean = false;
}

import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import 'reflect-metadata';

export class UploadFileDto {
	@Expose()
	// @IsBoolean({
	// 	message: 'Неправильный формат поля'
	// })
	// isDeletedOther?: boolean = false;
	isDeletedOther: boolean = false;
}

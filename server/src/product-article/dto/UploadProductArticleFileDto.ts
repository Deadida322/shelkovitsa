import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import 'reflect-metadata';

export class UploadProductArticleFileDto {
	// Поле приходит из multipart-формы строкой: 'false' не должно считаться истиной
	@IsOptional()
	@Expose()
	@Transform(({ value }) => {
		if (value === true || value === 'true') return true;
		if (value === false || value === 'false' || value === undefined || value === '')
			return false;
		return value;
	})
	@IsBoolean({
		message: 'Неправильный формат поля'
	})
	isDeletedOther?: boolean = false;
}

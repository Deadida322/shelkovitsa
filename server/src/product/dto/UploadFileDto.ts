import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class UploadFileDto {
	@Expose()
	isDeletedOther?: boolean = false;
}

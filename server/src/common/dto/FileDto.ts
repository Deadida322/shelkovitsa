import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class FileDto {
	@Expose()
	originalname: string;

	@Expose()
	filename: string;
}

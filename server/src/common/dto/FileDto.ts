import { Expose } from 'class-transformer';
import { IsInt, IsPositive, Max, Min } from 'class-validator';
import 'reflect-metadata';

export class FileDto {
	@Expose()
	originalname: string;

	@Expose()
	filename: string;
}

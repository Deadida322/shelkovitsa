import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumberString, Min } from 'class-validator';
import 'reflect-metadata';

export class CommonImageDto {
	@Expose()
	@IsInt()
	@IsNotEmpty()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	productFileId: number;
}

import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
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

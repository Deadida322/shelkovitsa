import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumberString, Min } from 'class-validator';
import 'reflect-metadata';

export class CommonImageDto {
	@Expose()
	@IsInt()
	@IsNotEmpty()
	productFileId: number;
}

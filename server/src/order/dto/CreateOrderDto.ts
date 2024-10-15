import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import 'reflect-metadata';
import { CreateOrderProductDto } from './CreateOrderProductDto';

export class CreateOrderDto {
	@Expose()
	@IsString()
	@IsNotEmpty()
	fio!: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	mail!: string;

	@Expose()
	@IsPhoneNumber()
	@IsNotEmpty()
	tel!: string;

	@Expose()
	@IsString()
	description?: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	region!: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	address!: string;

	@Expose()
	@IsInt()
	@IsNotEmpty()
	deliveryTypeId!: number;

	@Expose()
	@Type(() => CreateOrderProductDto)
	orderProducts?: CreateOrderProductDto[];
}

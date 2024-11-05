import { Expose, Type } from 'class-transformer';
import {
	ArrayNotEmpty,
	IsArray,
	IsEmail,
	IsEmpty,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsPhoneNumber,
	IsString,
	ValidateNested
} from 'class-validator';
import 'reflect-metadata';
import { CreateOrderProductDto } from './CreateOrderProductDto';

export class CreateOrderDto {
	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	fio!: string;

	@Expose()
	@IsEmail()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	mail!: string;

	@Expose()
	@IsPhoneNumber()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	tel!: string;

	@IsOptional()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@Expose()
	description?: string;

	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	region!: string;

	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	address!: string;

	@Expose()
	@IsInt({
		message: 'Поле должно быть числом'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	deliveryTypeId!: number;

	@Expose()
	@IsArray({
		message: 'Поле должно быть массивом'
	})
	@ArrayNotEmpty({
		message: 'Массив не может быть пустым'
	})
	@ValidateNested({
		each: true
	})
	@Type(() => CreateOrderProductDto)
	orderProducts?: CreateOrderProductDto[];
}

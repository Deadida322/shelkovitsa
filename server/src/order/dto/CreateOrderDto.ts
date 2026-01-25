import { Expose, Type } from 'class-transformer';
import {
	ArrayNotEmpty,
	IsArray,
	IsEmail,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsPhoneNumber,
	IsString,
	Min,
	ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import 'reflect-metadata';
import { CreateOrderProductDto } from './CreateOrderProductDto';

export class CreateOrderDto {
	@ApiProperty({ description: 'ФИО заказчика', example: 'Иван Иванов' })
	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	fio!: string;

	@ApiProperty({ description: 'Email заказчика', example: 'ivan@example.com' })
	@Expose()
	@IsEmail()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	mail!: string;

	@ApiProperty({ description: 'Телефон заказчика', example: '+79991234567' })
	@Expose()
	@IsPhoneNumber()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	tel!: string;

	@ApiPropertyOptional({ description: 'Комментарий к заказу', example: 'Комментарий к заказу' })
	@IsOptional()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@Expose()
	description?: string;

	@ApiProperty({ description: 'Регион доставки', example: 'Москва' })
	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	region!: string;

	@ApiProperty({ description: 'Адрес доставки', example: 'ул. Примерная, д. 1, кв. 1' })
	@Expose()
	@IsString({
		message: 'Поле должно быть строкой'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	address!: string;

	@ApiProperty({ description: 'ID типа доставки', example: 1, minimum: 1 })
	@Expose()
	@IsInt({
		message: 'Поле должно быть числом'
	})
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	@Min(1, {
		message: 'Поле должно быть > 0'
	})
	deliveryTypeId!: number;

	@ApiProperty({ 
		description: 'Список продуктов в заказе', 
		type: [CreateOrderProductDto],
		example: [{ productId: 1, amount: 2 }]
	})
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

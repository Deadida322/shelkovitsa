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
import { DeliveryTypeDto } from 'src/delivery-type/dto/DeliveryTypeDto';
import { OrderProductDto } from './OrderProductDto';

export class OrderDto {
	@Expose()
	id!: number;

	@Expose()
	fio!: string;

	@Expose()
	mail!: string;

	@Expose()
	tel!: string;

	@Expose()
	description?: string;

	@Expose()
	region!: string;

	@Expose()
	address!: string;

	@Expose()
	@Type(() => DeliveryTypeDto)
	deliveryType!: DeliveryTypeDto;

	@Expose()
	@Type(() => OrderProductDto)
	orderProducts?: OrderProductDto[];
}

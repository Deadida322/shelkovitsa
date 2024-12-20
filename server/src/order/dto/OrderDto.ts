import { Expose, Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { DeliveryTypeDto } from 'src/delivery-type/dto/DeliveryTypeDto';
import { OrderProductDto } from './OrderProductDto';
import { OrderStatus } from 'src/db/entities/Order';

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

	@Expose()
	@Transform((status) => convertConferenceUserStatus(status.value))
	status: string;
}

function convertConferenceUserStatus(type: any): string {
	return OrderStatus[+type] ?? type + '';
}

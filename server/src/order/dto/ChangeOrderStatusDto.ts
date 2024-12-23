import { Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import 'reflect-metadata';
import { OrderStatus } from 'src/db/entities/Order';

export class ChangeOrderStatusDto {
	@Expose()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	@Transform(({ value }) => ('' + value).toLowerCase())
	@IsEnum(OrderStatus)
	status: string;

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
	@Expose()
	orderId: number;
}

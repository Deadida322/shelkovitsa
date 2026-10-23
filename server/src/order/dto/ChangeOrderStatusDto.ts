import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';
import 'reflect-metadata';
import { OrderStatus } from 'src/db/entities/Order';

export class ChangeOrderStatusDto {
	@Expose()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	@Transform(({ value }) => ('' + value).toLowerCase())
	@IsEnum(OrderStatus)
	status: OrderStatus;
}

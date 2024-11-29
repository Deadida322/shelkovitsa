import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import 'reflect-metadata';

export class CreateOrderProductDto {
	@Expose()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	@IsPositive({
		message: 'Поле должно быть > 0'
	})
	@IsInt({
		message: 'Поле должно быть числом'
	})
	amount!: number;

	@Expose()
	@IsNotEmpty({
		message: 'Поле не может быть пустым'
	})
	@IsPositive({
		message: 'Поле должно быть > 0'
	})
	@IsInt({
		message: 'Поле должно быть числом'
	})
	productId!: number;
}

import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import 'reflect-metadata';

export class CreateOrderProductDto {
	@Expose()
	@IsNotEmpty()
	@IsPositive()
	@IsInt()
	amount!: number;

	@Expose()
	@IsNotEmpty()
	@IsPositive()
	@IsInt()
	productId!: number;
}

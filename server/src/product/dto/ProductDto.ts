import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class ProductDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	description?: string;

	@Expose()
	logo?: string;

	@Expose()
	article!: string;

	@Expose()
	amount!: number;

	@Expose()
	price!: number;
}

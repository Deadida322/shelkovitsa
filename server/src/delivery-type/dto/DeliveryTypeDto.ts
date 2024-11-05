import { Expose } from 'class-transformer';

import 'reflect-metadata';

export class DeliveryTypeDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	description!: string;
}

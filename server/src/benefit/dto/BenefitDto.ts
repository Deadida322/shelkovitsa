import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class BenefitDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	description!: string;

	@Expose()
	image!: string;
}

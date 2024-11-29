import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class ProductArticleDto {
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
	price!: number;
}

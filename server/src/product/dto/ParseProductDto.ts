import { Expose } from 'class-transformer';

export class ParseProductDto {
	@Expose()
	article: string;

	@Expose()
	name: string;

	@Expose()
	color: string;

	@Expose()
	size: string;

	@Expose()
	amount: string;

	@Expose()
	price: string;
}

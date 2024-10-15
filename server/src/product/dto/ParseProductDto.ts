import { Expose } from 'class-transformer';

export class ParseProductDto {
	@Expose()
	article: string;

	@Expose()
	color: string;

	@Expose()
	size: string;

	@Expose()
	amount: number;

	@Expose()
	price: number;
}

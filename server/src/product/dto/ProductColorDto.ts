import { Expose } from 'class-transformer';

export class ProductColorDto {
	@Expose()
	id!: number;

	@Expose()
	amount!: number;

	@Expose()
	name!: string;
}

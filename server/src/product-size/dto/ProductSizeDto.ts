import { Expose } from 'class-transformer';

export class ProductSizeDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;
}

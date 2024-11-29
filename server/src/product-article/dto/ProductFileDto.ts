import { Expose } from 'class-transformer';

export class ProductFileDto {
	@Expose()
	id!: number;

	@Expose()
	image!: string;
}

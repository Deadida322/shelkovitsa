import { Expose } from 'class-transformer';

export class ProductFileDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;

	@Expose()
	isLogo!: boolean;
}

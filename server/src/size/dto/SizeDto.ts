import { Expose } from 'class-transformer';

export class SizeDto {
	@Expose()
	id!: number;

	@Expose()
	image!: string;
}

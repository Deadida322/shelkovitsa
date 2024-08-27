import { Expose } from 'class-transformer';

export class ColorDto {
	@Expose()
	id!: number;

	@Expose()
	name!: string;
}

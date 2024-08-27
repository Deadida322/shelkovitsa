import { Expose } from 'class-transformer';
import { ColorDto } from './ColorDto';

export class ProductColorDto {
	@Expose()
	id!: number;

	@Expose()
	color: ColorDto;
}

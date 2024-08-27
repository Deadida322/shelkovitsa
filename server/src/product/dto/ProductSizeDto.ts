import { Expose, Type } from 'class-transformer';
import { SizeDto } from 'src/size/dto/SizeDto';

export class ProductSizeDto {
	@Expose()
	id!: number;

	@Expose()
	image!: string;

	@Expose()
	@Type(() => SizeDto)
	size: SizeDto;
}

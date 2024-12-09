import { Expose } from 'class-transformer';
import { ProductSizeDto } from './ProductSizeDto';

export class AdminProductSizeDto extends ProductSizeDto {
	@Expose()
	is_deleted!: boolean;
}

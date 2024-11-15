import { Expose } from 'class-transformer';
import 'reflect-metadata';
import { ProductDto } from './ProductDto';

export class ProductAdminDto extends ProductDto {
	@Expose()
	is_deleted!: boolean;

	@Expose()
	isVisible!: boolean;
}

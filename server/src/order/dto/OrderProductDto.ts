import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';
import { ProductDto } from 'src/product/dto/ProductDto';

export class OrderProductDto {
	@Expose()
	id!: number;

	@Expose()
	amount!: number;

	@Expose()
	@Type(() => ProductDto)
	product!: ProductDto;
}

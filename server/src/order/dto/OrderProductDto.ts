import { Expose, Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { ProductDto } from 'src/product/dto/ProductDto';

export class OrderProductDto {
	@Expose()
	id!: number;

	@Expose()
	amount!: number;

	// цена за единицу на момент заказа
	@Expose()
	@Transform(({ value }) => (value == null ? value : Number(value)))
	price!: number;

	@Expose()
	@Type(() => ProductDto)
	product!: ProductDto;
}

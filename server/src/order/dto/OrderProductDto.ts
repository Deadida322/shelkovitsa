import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';
import { ProductArticleDto } from 'src/product-article/dto/ProductArticleDto';

export class OrderProductDto {
	@Expose()
	id!: number;

	@Expose()
	amount!: number;

	@Expose()
	@Type(() => ProductArticleDto)
	product!: ProductArticleDto;
}

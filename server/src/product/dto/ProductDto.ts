import { Expose, Type } from 'class-transformer';
import { ProductArticleDto } from '../../product-article/dto/ProductArticleDto';
import { ProductSizeDto } from './ProductSizeDto';
import { ProductColorDto } from '../../product-color/dto/ProductColorDto';

export class ProductDto {
	@Expose()
	id!: number;

	@Expose()
	amount!: number;

	@Expose()
	@Type(() => ProductArticleDto)
	productArticle: ProductArticleDto;

	@Expose()
	@Type(() => ProductSizeDto)
	productSize: ProductSizeDto;

	@Expose()
	@Type(() => ProductColorDto)
	productColor: ProductColorDto;
}

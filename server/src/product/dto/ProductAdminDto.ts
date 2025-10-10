import { Expose, Type } from 'class-transformer';
import { ProductSizeDto } from '../../product-size/dto/ProductSizeDto';
import { ProductColorDto } from '../../product-color/dto/ProductColorDto';
import { ProductArticleAdminDto } from 'src/product-article/dto/ProductArticleAdminDto';

export class ProductAdminDto {
	@Expose()
	id!: number;

	@Expose()
	amount!: number;

	@Expose()
	@Type(() => ProductArticleAdminDto)
	productArticle: ProductArticleAdminDto;

	@Expose()
	@Type(() => ProductSizeDto)
	productSize: ProductSizeDto;

	@Expose()
	@Type(() => ProductColorDto)
	productColor: ProductColorDto;
}

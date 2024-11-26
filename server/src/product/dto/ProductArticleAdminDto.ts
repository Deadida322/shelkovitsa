import { Expose } from 'class-transformer';
import 'reflect-metadata';
import { ProductArticleDto } from './ProductArticleDto';

export class ProductArticleAdminDto extends ProductArticleDto {
	@Expose()
	is_deleted!: boolean;

	@Expose()
	isVisible!: boolean;
}

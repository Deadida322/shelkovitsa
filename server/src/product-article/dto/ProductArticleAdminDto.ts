import { Expose, Transform } from 'class-transformer';
import 'reflect-metadata';
import { ProductArticleDto } from './ProductArticleDto';

export class ProductArticleAdminDto extends ProductArticleDto {
	// в архиве (мягко удалён)
	@Expose()
	@Transform(({ obj }) => obj.deleted_at != null, { toClassOnly: true })
	is_deleted!: boolean;

	@Expose()
	isVisible!: boolean;
}

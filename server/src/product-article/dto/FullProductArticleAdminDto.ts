import { Expose, Transform } from 'class-transformer';
import 'reflect-metadata';

import { FullProductArticleDto } from './FullProductArticleDto';

export class FullProductArticleAdminDto extends FullProductArticleDto {
	// в архиве (мягко удалён)
	@Expose()
	@Transform(({ obj }) => obj.deleted_at != null, { toClassOnly: true })
	is_deleted!: boolean;

	@Expose()
	isVisible!: boolean;
}

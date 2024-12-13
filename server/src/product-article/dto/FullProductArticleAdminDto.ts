import { Expose } from 'class-transformer';
import 'reflect-metadata';

import { FullProductArticleDto } from './FullProductArticleDto';

export class FullProductArticleAdminDto extends FullProductArticleDto {
	@Expose()
	is_deleted!: boolean;

	@Expose()
	isVisible!: boolean;
}

import { Expose, Type } from 'class-transformer';
import { ParseProductColorDto } from './ParseProductColorDto';

export class ParseProductArticleDto {
	@Expose()
	article: string;

	@Expose()
	@Type(() => ParseProductArticleDto)
	color: ParseProductColorDto;

	@Expose()
	size: string;

	@Expose()
	amount: number;

	@Expose()
	price: number;

	@Expose()
	country?: string;

	@Expose()
	description?: string;
}

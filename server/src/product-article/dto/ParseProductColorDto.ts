import { Expose } from 'class-transformer';

export class ParseProductColorDto {
	@Expose()
	name: string;

	@Expose()
	url?: string;
}

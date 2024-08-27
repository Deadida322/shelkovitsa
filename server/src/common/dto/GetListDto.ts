import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class GetListDto {
	@Expose()
	page: number;
	@Expose()
	itemsPerPage: number;
}

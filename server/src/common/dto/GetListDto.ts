import { Expose } from 'class-transformer';
import { IsInt, IsPositive, Max, Min } from 'class-validator';
import 'reflect-metadata';

export class GetListDto {
	@Expose()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	page: number;

	@Expose()
	@IsInt()
	@IsPositive({
		message: 'Должно быть больше 0'
	})
	@Max(20, {
		message: 'Максимум 20 элементов на страницу'
	})
	itemsPerPage: number;
}

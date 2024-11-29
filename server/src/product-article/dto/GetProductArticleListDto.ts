import { Expose } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import 'reflect-metadata';
import { GetListDto } from 'src/common/dto/GetListDto';

export class GetProductArticleListDto extends GetListDto {
	@Expose()
	@IsOptional()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	categoryId: number;

	@Expose()
	@IsOptional()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	subcategoryId: number;

	@Expose()
	@IsOptional()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	minPrice: number;

	@Expose()
	@IsOptional()
	@IsInt()
	@Min(0, {
		message: 'Должно быть >= 0'
	})
	maxPrice: number;
}

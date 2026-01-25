import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class BindProductArticleToSubcategoryDto {
	@IsNotEmpty()
	@IsInt({
		message: 'productId должен быть числом'
	})
	@Expose()
	productArticleId!: number;

	@IsNotEmpty()
	@IsInt({
		message: 'subcategoryId должен быть числом'
	})
	@Expose()
	subcategoryId!: number;
}

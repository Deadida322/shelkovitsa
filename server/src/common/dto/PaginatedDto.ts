import { ApiProperty } from '@nestjs/swagger';
import { ClassConstructor, Expose, Type } from 'class-transformer';

// Ответ списка { data, count, page, itemsPerPage }: элементы сериализуются как itemDto
export function PaginatedDto<T>(itemDto: ClassConstructor<T>) {
	class Paginated {
		@Expose()
		@Type(() => itemDto)
		@ApiProperty({ type: itemDto, isArray: true })
		data: T[];

		@Expose()
		@ApiProperty()
		count: number;

		@Expose()
		@ApiProperty()
		page: number;

		@Expose()
		@ApiProperty()
		itemsPerPage: number;
	}
	Object.defineProperty(Paginated, 'name', { value: `Paginated${itemDto.name}` });
	return Paginated;
}

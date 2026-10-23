import { GetListDto } from 'src/common/dto/GetListDto';

export interface IPaginateResult<T> extends GetListDto {
	data: T[];
	count: number;
}

export function getPaginateWhere(getListDto: GetListDto) {
	return {
		take: getListDto.itemsPerPage,
		skip: getListDto.itemsPerPage * getListDto.page
	};
}

// Сериализацию элементов делает ClassSerializerInterceptor (PaginatedDto в контроллере)
export function getPaginateResult<T>(
	data: T[],
	count: number,
	{ page, itemsPerPage }: GetListDto
): IPaginateResult<T> {
	return { data, count, page, itemsPerPage };
}

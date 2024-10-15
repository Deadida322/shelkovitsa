import { GetListDto } from 'src/common/dto/GetListDto';
import { convertToJsonMany } from './convertHelper';
import { ClassConstructor } from 'class-transformer';

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

export function getPaginateResult<T>(
	cls: ClassConstructor<T>,
	payload: any[],
	count: number,
	getListDto: GetListDto
): IPaginateResult<T> {
	return {
		data: convertToJsonMany(cls, payload),
		count,
		...getListDto
	};
}

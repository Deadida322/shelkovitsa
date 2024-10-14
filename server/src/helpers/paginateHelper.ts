import { GetListDto } from 'src/common/dto/GetListDto';

export function getPaginate(getListDto: GetListDto) {
	return {
		take: getListDto.itemsPerPage,
		skip: getListDto.itemsPerPage * getListDto.page
	};
}

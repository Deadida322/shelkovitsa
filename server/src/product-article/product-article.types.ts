import { baseWhere } from 'src/common/utils';

export type BaseWhereType = {
	isVisible: boolean;
	is_deleted: boolean;
};

export const excelFileType =
	/(vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-excel|octet-stream)/i;

export const imageFileType = '.(jpeg|jpg|png|webp)';

export const baseProductWhere: BaseWhereType = {
	...baseWhere,
	isVisible: true
};

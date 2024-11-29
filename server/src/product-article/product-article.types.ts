import { baseWhere } from 'src/common/utils';

export type BaseWhereType = {
	isVisible: boolean;
	is_deleted: boolean;
};

export const excelFileType =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel';

export const imageFileType = '.(jpeg|jpg|png|webp)';

export const baseProductWhere: BaseWhereType = {
	...baseWhere,
	isVisible: true
};

export const excelFileType =
	/^application\/(vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-excel|octet-stream)$/i;

export const imageFileType = '.(jpeg|jpg|png|webp)';

// Артикул на витрине: опубликован (удалённые TypeORM исключает сам)
export const baseProductWhere = {
	isVisible: true
};

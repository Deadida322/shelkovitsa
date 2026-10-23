import { ColumnOptions } from 'typeorm';

// pg отдаёт numeric строкой, чтобы не терять точность; для цен в рублях хватает number
export const moneyColumn: ColumnOptions = {
	type: 'numeric',
	precision: 12,
	scale: 2,
	transformer: {
		to: (value?: number | null) => value,
		from: (value?: string | null) => (value == null ? value : Number(value))
	}
};

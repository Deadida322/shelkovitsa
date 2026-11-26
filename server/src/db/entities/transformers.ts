import { ColumnOptions } from 'typeorm';

// Цены — целые копейки (bigint). pg отдаёт bigint строкой.
export const moneyColumn: ColumnOptions = {
	type: 'bigint',
	transformer: {
		to: (value?: number | null) => value,
		from: (value?: string | number | null) =>
			value == null ? value : Number(value)
	}
};

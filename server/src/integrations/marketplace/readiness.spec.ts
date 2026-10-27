import {
	normalizeSupplierSize,
	SUPPLIER_COLUMNS as C
} from 'src/product-article/supplier-format';
import {
	isInternalBarcode,
	isScientificNotation,
	isValidGtin,
	normalizeBarcode
} from './gtin';
import { analyzeSupplierRows } from './readiness';

describe('GTIN', () => {
	it.each(['8422091144289', '4600000000008', '96385074', '036000291452'])(
		'валидный: %s',
		(code) => expect(isValidGtin(code)).toBe(true)
	);

	it.each(['8422091144288', '12345', '84220911442890000', 'abc'])(
		'невалидный: %s',
		(code) => expect(isValidGtin(code)).toBe(false)
	);

	it('число из Excel → строка цифр, экспоненциальная запись распознаётся', () => {
		expect(normalizeBarcode(8422091144289)).toBe('8422091144289');
		expect(isScientificNotation('8,42209E+12')).toBe(true);
		expect(isScientificNotation('8422091144289')).toBe(false);
	});

	it('внутренние коды магазина (2xx) — не GTIN для маркетплейса', () => {
		expect(isInternalBarcode('2000000012346')).toBe(true);
		expect(isInternalBarcode('8422091144289')).toBe(false);
	});
});

describe('normalizeSupplierSize — размеры, которые Excel сделал датами', () => {
	it.each([
		[45750, '3/4'],
		[45939, '9/10'],
		[46002, '11/12'],
		['75B', '75B'],
		[42, '42'],
		[' M ', 'M']
	])('%p → %p', (input, expected) =>
		expect(normalizeSupplierSize(input)).toBe(expected)
	);
});

describe('analyzeSupplierRows', () => {
	const colors = new Map([['Avena', 'Бежевый']]);
	const sizes = new Map([
		['M', '44'],
		['3/4', '98']
	]);

	function row(overrides: Partial<Record<keyof typeof C, unknown>> = {}) {
		const values: Record<keyof typeof C, unknown> = {
			code: 'A-1-M',
			productCategory: 'Женское нижнее белье',
			productSubcategory: 'Трусы',
			brand: 'Janira',
			colorName: 'Avena',
			colorUrl: '',
			size: 'M',
			price: 1990,
			barcode: 8422091144289,
			country: 'Испания',
			description: 'Описание',
			composition: 'Хлопок',
			manufacturer: 'Janira',
			article: 'A-1',
			fullName: '',
			imageUrls: 'https://x/a.jpg;https://x/b.jpg',
			name: 'Трусы слип',
			sale: '',
			amount: '>5',
			...overrides
		};
		const cells: unknown[] = [];
		for (const [key, index] of Object.entries(C))
			cells[index] = values[key as keyof typeof C];
		return cells;
	}

	it('готовая строка — готова для Маркета, но не для Доставки (нет веса и габаритов)', () => {
		const report = analyzeSupplierRows([row()], colors, sizes);
		expect(report.readyForMarket).toEqual({ rows: 1, articles: 1 });
		expect(report.readyForDelivery.rows).toBe(0);
		expect(report.checks.find((c) => c.key === 'weight')!.failed).toBe(1);
		expect(report.stockOnlyAtLeast).toBe(1);
	});

	it('проблемы строки считаются по проверкам, артикул готов только целиком', () => {
		const report = analyzeSupplierRows(
			[
				row(),
				row({ code: 'A-1-L', size: 'L' }), // размер не сопоставлен
				row({ code: 'B-1', article: 'B', barcode: '8,42209E+12' }), // испорченный штрихкод
				row({ code: 'C-1', article: 'C', barcode: 2000000012346 }), // внутренний
				row({ code: 'D-1', article: 'D', size: 45750 }) // «3/4» из Excel-даты
			],
			colors,
			sizes
		);
		const failed = (key: string) => report.checks.find((c) => c.key === key)!.failed;

		expect(failed('size')).toBe(1);
		expect(report.unmappedSizes).toEqual([['L', 1]]);
		expect(failed('gtin')).toBe(1);
		expect(failed('gtin_internal')).toBe(1);
		expect(report.readyForMarket).toEqual({ rows: 2, articles: 1 });
		expect(report.articles).toBe(4);
	});

	it('дубли кода варианта и пустые строки', () => {
		const report = analyzeSupplierRows([row(), row(), [], [null, '']], colors, sizes);
		expect(report.rows).toBe(2);
		expect(report.checks.find((c) => c.key === 'offer_id')!.failed).toBe(2);
	});
});

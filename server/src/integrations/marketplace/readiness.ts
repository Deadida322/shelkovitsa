import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import {
	normalizeSupplierSize,
	parseAmount,
	SUPPLIER_COLUMNS as C
} from 'src/product-article/supplier-format';
import {
	isInternalBarcode,
	isScientificNotation,
	isValidGtin,
	normalizeBarcode
} from './gtin';

// Лимиты карточки Яндекс Маркета (Partner API, offer-mappings/update)
export const MARKET_LIMITS = {
	nameMax: 256,
	nameOptimalMax: 60,
	descriptionMax: 6000,
	descriptionRecommendedMin: 400,
	picturesMax: 30
};

export type CheckScope = 'market' | 'delivery';

export interface CheckResult {
	key: string;
	title: string;
	scope: CheckScope;
	// обязательна для выгрузки (иначе — рекомендация)
	required: boolean;
	failed: number;
	examples: string[];
}

export interface ReadinessReport {
	rows: number;
	articles: number;
	categories: { category: string; subcategory: string; rows: number }[];
	checks: CheckResult[];
	readyForMarket: { rows: number; articles: number };
	readyForDelivery: { rows: number };
	unmappedSizes: [string, number][];
	unmappedColors: [string, number][];
	stockOnlyAtLeast: number;
	picturesPerArticle: { min: number; median: number; max: number };
}

type Row = unknown[];

const text = (row: Row, column: number) => String(row[column] ?? '').trim();

export function analyzeSupplierRows(
	rows: Row[],
	colorMap: Map<string, string>,
	sizeMap: Map<string, string>
): ReadinessReport {
	const data = rows.filter((row) => row?.some((v) => String(v ?? '').trim() !== ''));
	const codes = new Map<string, number>();
	data.forEach((row) =>
		codes.set(text(row, C.code), (codes.get(text(row, C.code)) ?? 0) + 1)
	);

	const checks = new Map<string, CheckResult>();
	const define = (key: string, title: string, scope: CheckScope, required: boolean) =>
		checks.set(key, { key, title, scope, required, failed: 0, examples: [] });

	define('gtin', 'Штрихкод — валидный GTIN (EAN-13/8, UPC)', 'market', true);
	define('gtin_internal', 'Штрихкод не внутренний (2xx)', 'market', true);
	define('pictures', 'Хотя бы одно фото', 'market', true);
	define('name', `Название есть и ≤ ${MARKET_LIMITS.nameMax} символов`, 'market', true);
	define(
		'name_optimal',
		`Название ≤ ${MARKET_LIMITS.nameOptimalMax} символов (рекомендация)`,
		'market',
		false
	);
	define('description', 'Описание есть', 'market', true);
	define(
		'description_long',
		`Описание ≥ ${MARKET_LIMITS.descriptionRecommendedMin} символов (рекомендация)`,
		'market',
		false
	);
	define('brand', 'Бренд (vendor)', 'market', true);
	define('country', 'Страна производства', 'market', false);
	define('composition', 'Состав', 'market', false);
	define('price', 'Цена > 0', 'market', true);
	define('stock', 'Остаток читается числом', 'market', true);
	define('color', 'Цвет сопоставлен (colors.xlsx)', 'market', true);
	define('size', 'Размер сопоставлен (sizes.xlsx)', 'market', true);
	define('offer_id', 'Код варианта уникален (offerId)', 'market', true);
	define('weight', 'Вес брутто, г', 'delivery', true);
	define('dimensions', 'Габариты упаковки, см', 'delivery', true);

	const unmappedSizes = new Map<string, number>();
	const unmappedColors = new Map<string, number>();
	const articles = new Map<string, { pictures: Set<string>; ready: boolean }>();
	const categories = new Map<string, number>();
	let readyRows = 0;
	let stockOnlyAtLeast = 0;

	for (const row of data) {
		const code = text(row, C.code) || `строка без кода (${text(row, C.article)})`;
		const failed: string[] = [];
		const fail = (key: string) => {
			const check = checks.get(key)!;
			check.failed++;
			if (check.examples.length < 5) check.examples.push(code);
			failed.push(key);
		};

		const rawBarcode = row[C.barcode];
		const barcode = normalizeBarcode(rawBarcode);
		if (isScientificNotation(rawBarcode) || !isValidGtin(barcode)) fail('gtin');
		else if (isInternalBarcode(barcode)) fail('gtin_internal');

		const pictures = text(row, C.imageUrls)
			.split(';')
			.map((u) => u.trim())
			.filter(Boolean);
		if (!pictures.length) fail('pictures');

		const name = text(row, C.name);
		if (!name || name.length > MARKET_LIMITS.nameMax) fail('name');
		else if (name.length > MARKET_LIMITS.nameOptimalMax) fail('name_optimal');

		const description = text(row, C.description);
		if (!description) fail('description');
		else if (description.length < MARKET_LIMITS.descriptionRecommendedMin)
			fail('description_long');

		if (!text(row, C.brand)) fail('brand');
		if (!text(row, C.country)) fail('country');
		if (!text(row, C.composition)) fail('composition');
		if (!(Number(row[C.price]) > 0)) fail('price');

		const amount = parseAmount(row[C.amount]);
		if (Number.isNaN(amount)) fail('stock');
		if (/^>/.test(text(row, C.amount))) stockOnlyAtLeast++;

		const color = text(row, C.colorName);
		if (!colorMap.has(capitalizeFirstLetter(color))) {
			fail('color');
			unmappedColors.set(color, (unmappedColors.get(color) ?? 0) + 1);
		}
		const size = normalizeSupplierSize(row[C.size]).toUpperCase();
		if (!sizeMap.has(size)) {
			fail('size');
			unmappedSizes.set(size, (unmappedSizes.get(size) ?? 0) + 1);
		}
		if ((codes.get(text(row, C.code)) ?? 0) > 1 || !text(row, C.code))
			fail('offer_id');

		// в выгрузке поставщика веса и габаритов нет вообще
		fail('weight');
		fail('dimensions');

		const marketReady = !failed.some((key) => {
			const check = checks.get(key)!;
			return check.scope === 'market' && check.required;
		});
		if (marketReady) readyRows++;

		const articleKey = text(row, C.article);
		const article = articles.get(articleKey) ?? {
			pictures: new Set<string>(),
			ready: true
		};
		pictures.forEach((p) => article.pictures.add(p));
		article.ready &&= marketReady;
		articles.set(articleKey, article);

		const categoryKey = `${text(row, C.productCategory)}\u0000${text(row, C.productSubcategory)}`;
		categories.set(categoryKey, (categories.get(categoryKey) ?? 0) + 1);
	}

	const pictureCounts = [...articles.values()]
		.map((a) => a.pictures.size)
		.sort((a, b) => a - b);
	const top = (map: Map<string, number>) =>
		[...map.entries()].sort((a, b) => b[1] - a[1]);

	return {
		rows: data.length,
		articles: articles.size,
		categories: [...categories.entries()]
			.map(([key, count]) => {
				const [category, subcategory] = key.split('\u0000');
				return { category, subcategory, rows: count };
			})
			.sort((a, b) => b.rows - a.rows),
		checks: [...checks.values()],
		readyForMarket: {
			rows: readyRows,
			articles: [...articles.values()].filter((a) => a.ready).length
		},
		readyForDelivery: { rows: 0 },
		unmappedSizes: top(unmappedSizes),
		unmappedColors: top(unmappedColors),
		stockOnlyAtLeast,
		picturesPerArticle: {
			min: pictureCounts[0] ?? 0,
			median: pictureCounts[Math.floor(pictureCounts.length / 2)] ?? 0,
			max: pictureCounts[pictureCounts.length - 1] ?? 0
		}
	};
}

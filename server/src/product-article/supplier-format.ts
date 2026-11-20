import { readSheet } from 'src/helpers/excelHelper';
import { getColorsPath, getSizesPath } from 'src/helpers/storageHelper';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';

// Колонки выгрузки поставщика (первая строка файла — заголовок с этими названиями)
export const SUPPLIER_COLUMNS = {
	code: 0, // «Код» — код варианта (артикул + цвет + размер)
	productCategory: 1, // «Категория»
	productSubcategory: 2, // «Тип»
	brand: 3, // «Торговая марка»
	colorName: 4, // «Цвет»
	colorUrl: 5, // «Фото цвета»
	size: 6, // «Размер»
	price: 7, // «Цена»
	barcode: 8, // «Штрих-код»
	country: 9, // «Страна»
	description: 10, // «Описание»
	composition: 11, // «Состав»
	manufacturer: 12, // «Производитель»
	article: 13, // «Артикул на сайте»
	fullName: 14, // «Полное наименование»
	imageUrls: 15, // «Фото (через ;)»
	name: 16, // «Наименование на сайте»
	sale: 17, // «Распродажа»
	amount: 18 // «Остаток»
} as const;

// Служебные «категории» выгрузки: склад образцов и брака, а не товарные разделы.
// Строки из них не импортируются и попадают в файл ошибок.
const EXCLUDED_CATEGORIES = new Set(['образцы', 'некондиция', 'уценка']);

export function isExcludedCategory(name: unknown): boolean {
	return EXCLUDED_CATEGORIES.has(
		String(name ?? '')
			.trim()
			.toLowerCase()
	);
}

// Линейки одного бренда у поставщика записаны отдельными «брендами»:
// «Sielei куп.», «Jolidon мужское», «Infiore купальники», «Брестские муж.»
const BRAND_LINE_SUFFIX = /\s+(?:куп\.?|купальники|мужское|муж\.?)$/i;

export function normalizeBrand(value: string | undefined): string | undefined {
	const brand = value?.replace(BRAND_LINE_SUFFIX, '').trim();
	return brand || undefined;
}

// Названия типов у поставщика, которые покупатель не узнаёт («Бюсты» — это бюстгальтеры)
const TYPE_ALIASES = new Map([['бюсты', 'Бюстгальтеры']]);

export function normalizeSubcategory(name: string): string {
	return TYPE_ALIASES.get(name.trim().toLowerCase()) ?? name;
}

// Остаток у поставщика: число или «>5» (больше пяти) — берём гарантированный минимум
export function parseAmount(value: unknown): number {
	if (typeof value === 'number') {
		return Math.floor(value);
	}
	const text = String(value ?? '').trim();
	const atLeast = /^>\s*(\d+)$/.exec(text);
	return atLeast ? Number(atLeast[1]) : text === '' ? NaN : Number(text);
}

// Excel превращает размеры вида «3/4», «11/12» в даты (серийный номер дня: 45750 = 03.04.2025).
// День и месяц и есть исходный размер — восстанавливаем «3/4».
export function normalizeSupplierSize(value: unknown): string {
	if (
		typeof value === 'number' &&
		value > 40000 &&
		value < 60000 &&
		Number.isInteger(value)
	) {
		const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
		return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
	}
	return String(value ?? '').trim();
}

export async function readMappingFile(
	filePath: string,
	normalize: (value: string) => string
) {
	const data = await readSheet(filePath);
	const map = new Map<string, string>();
	for (const [from, to] of data) {
		const source = String(from ?? '').trim();
		const target = String(to ?? '').trim();
		if (source && target) {
			map.set(normalize(source), normalize(target));
		}
	}
	return map;
}

// colors.xlsx: «название у поставщика» → «название в каталоге»
export async function loadColorMap(): Promise<Map<string, string>> {
	return readMappingFile(await getColorsPath(), capitalizeFirstLetter);
}

// sizes.xlsx: «размер у поставщика» → «размер в каталоге»
export async function loadSizeMap(): Promise<Map<string, string>> {
	return readMappingFile(await getSizesPath(), (value) => value.toUpperCase());
}

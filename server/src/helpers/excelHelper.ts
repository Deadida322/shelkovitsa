import * as path from 'path';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import { SaxesParser, SaxesTagPlain } from 'saxes';
import yauzl, { Entry, ZipFile } from 'yauzl';

/**
 * Чтение и запись Excel (.xlsx).
 *
 * Чтение — свой потоковый разбор: файл приходит от пользователя, поэтому
 *  - zip открывается по центральному каталогу (yauzl), лимиты проверяются до распаковки,
 *    а yauzl сверяет фактический размер распакованных данных с заявленным (zip-бомба);
 *  - XML разбирается SAX-парсером без DTD и внешних сущностей (XXE, «billion laughs»);
 *  - строки листа отдаются по одной, лист целиком в память не попадает.
 * Потоковое чтение exceljs 4.4 не годится: ломает UTF-8 на границах чанков и теряет
 * xl/workbook.xml, если лист лежит в архиве раньше sharedStrings (так сохраняет Excel).
 *
 * Запись (файл ошибок импорта, сид) — exceljs.
 */

export interface ExcelLimits {
	maxEntries: number; // файлов внутри zip
	maxUncompressedBytes: number; // суммарно после распаковки
	maxCompressionRatio: number; // для крупных файлов внутри zip
	maxRows: number;
	maxColumns: number;
	maxCellLength: number;
}

// Реальная выгрузка поставщика: 4 МБ → 31 МБ XML (сжатие ~8×), 36 тыс. строк, 19 колонок
export const DEFAULT_EXCEL_LIMITS: ExcelLimits = {
	maxEntries: 1000,
	maxUncompressedBytes: 256 * 1024 * 1024,
	maxCompressionRatio: 100,
	maxRows: 100_000,
	maxColumns: 200,
	maxCellLength: 32_767 // предел самого Excel
};

// Ошибка формата или лимита — вина файла, а не сервера (→ 400)
export class ExcelFileError extends Error {}

export type CellValue = string | number | boolean | undefined;

export interface SheetRow {
	number: number; // номер строки в Excel, с 1
	values: CellValue[]; // с 0: values[0] — колонка A
}

// Путь к файлу или содержимое (файл ошибок, который сформировали мы сами)
export type XlsxSource = string | Buffer;

const MAX_EXCEL_COLUMNS = 16_384; // XFD

/**
 * Строки первого листа по одной. Пустые строки пропускаются.
 * Числа остаются числами (Excel-даты — серийными номерами дня), стили не читаются:
 * так их и ждёт разбор выгрузки (см. normalizeSupplierSize).
 */
export async function* readSheetRows(
	source: XlsxSource,
	limits: ExcelLimits = DEFAULT_EXCEL_LIMITS
): AsyncGenerator<SheetRow> {
	let zip: ZipFile | undefined;
	try {
		zip = await openZip(source);
		const entries = await listEntries(zip, limits);
		const { sheet, sharedStrings } = await locateParts(zip, entries);
		const strings = sharedStrings ? await readSharedStrings(zip, sharedStrings) : [];
		yield* readWorksheet(zip, sheet, strings, limits);
	} catch (error) {
		if (error instanceof ExcelFileError) throw error;
		throw new ExcelFileError(
			`Не удалось прочитать Excel: ${error instanceof Error ? error.message : String(error)}`
		);
	} finally {
		zip?.close();
	}
}

// Все строки первого листа — для небольших файлов (справочники, файл ошибок, тесты)
export async function readSheet(
	source: XlsxSource,
	limits: ExcelLimits = DEFAULT_EXCEL_LIMITS
): Promise<CellValue[][]> {
	const rows: CellValue[][] = [];
	for await (const row of readSheetRows(source, limits)) {
		rows.push(row.values);
	}
	return rows;
}

// Excel из массива строк; строки пишутся как текст, формулами они не становятся
export async function buildXlsx(sheetName: string, rows: unknown[][]): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet(sheetName);
	for (const row of rows) {
		sheet.addRow(row.map(toWritable));
	}
	return Buffer.from(await workbook.xlsx.writeBuffer());
}

function toWritable(value: unknown): CellValue {
	if (value === null || value === undefined) return undefined;
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}
	return String(value);
}

// ---------- zip ----------

function openZip(source: XlsxSource): Promise<ZipFile> {
	const options: yauzl.Options = {
		lazyEntries: true,
		autoClose: false,
		validateEntrySizes: true,
		strictFileNames: false
	};
	return new Promise((resolve, reject) => {
		const done = (error: Error | null, zip?: ZipFile) =>
			error || !zip
				? reject(
						new ExcelFileError(
							`Файл не похож на Excel (.xlsx): ${error?.message ?? 'повреждён zip-архив'}`
						)
					)
				: resolve(zip);
		if (typeof source === 'string') yauzl.open(source, options, done);
		else yauzl.fromBuffer(source, options, done);
	});
}

// Заявленные размеры из центрального каталога; при распаковке yauzl их проверяет
function listEntries(zip: ZipFile, limits: ExcelLimits): Promise<Map<string, Entry>> {
	if (zip.entryCount > limits.maxEntries) {
		return Promise.reject(
			new ExcelFileError(`Слишком много файлов внутри Excel: ${zip.entryCount}`)
		);
	}
	return new Promise((resolve, reject) => {
		const entries = new Map<string, Entry>();
		let total = 0;
		zip.on('entry', (entry: Entry) => {
			total += entry.uncompressedSize;
			// маленькие файлы (пустые листы, повторяющийся XML) сжимаются сильно и честно
			if (
				entry.uncompressedSize > 1024 * 1024 &&
				entry.uncompressedSize > entry.compressedSize * limits.maxCompressionRatio
			) {
				return reject(
					new ExcelFileError(
						'Excel-файл сжат подозрительно сильно (zip-бомба?)'
					)
				);
			}
			if (total > limits.maxUncompressedBytes) {
				return reject(
					new ExcelFileError(
						`Excel-файл слишком большой после распаковки: больше ${Math.round(limits.maxUncompressedBytes / 1024 / 1024)} МБ`
					)
				);
			}
			entries.set(entry.fileName, entry);
			zip.readEntry();
		});
		zip.once('end', () => resolve(entries));
		// постоянный слушатель: событие error без слушателя роняет процесс
		zip.on('error', reject);
		zip.readEntry();
	});
}

function openEntry(zip: ZipFile, entry: Entry): Promise<Readable> {
	return new Promise((resolve, reject) =>
		zip.openReadStream(entry, (error, stream) =>
			error || !stream ? reject(error) : resolve(stream)
		)
	);
}

// ---------- XML ----------

// Имя без префикса пространства имён: «x:row» → «row»
const local = (name: string) => name.slice(name.indexOf(':') + 1);

interface XmlHandlers<T> {
	open?: (name: string, attributes: Record<string, string>) => void;
	close?: (name: string) => void;
	text?: (text: string) => void;
	emit?: () => T[]; // готовые элементы после очередного чанка
}

// SAX по распакованному потоку; элементы отдаются по мере разбора
async function* parseXml<T>(
	zip: ZipFile,
	entry: Entry,
	handlers: XmlHandlers<T>
): AsyncGenerator<T> {
	const parser = new SaxesParser();
	parser.on('opentag', (tag: SaxesTagPlain) =>
		handlers.open?.(local(tag.name), tag.attributes)
	);
	parser.on('closetag', (tag: SaxesTagPlain) => handlers.close?.(local(tag.name)));
	parser.on('text', (text) => handlers.text?.(text));
	parser.on('cdata', (text) => handlers.text?.(text));

	const stream = await openEntry(zip, entry);
	stream.setEncoding('utf8'); // декодер потока сам склеивает символы на границах чанков
	for await (const chunk of stream) {
		parser.write(chunk as string);
		if (handlers.emit) yield* handlers.emit();
	}
	parser.close();
	if (handlers.emit) yield* handlers.emit();
}

async function drain(xml: AsyncGenerator<unknown>) {
	while (!(await xml.next()).done);
}

// Первый лист книги и общие строки — по xl/workbook.xml и его связям
async function locateParts(zip: ZipFile, entries: Map<string, Entry>) {
	const relations = new Map<string, { target: string; type: string }>();
	const relationsEntry = entries.get('xl/_rels/workbook.xml.rels');
	if (relationsEntry) {
		await drain(
			parseXml(zip, relationsEntry, {
				open: (name, attributes) => {
					if (name === 'Relationship' && attributes.Id && attributes.Target) {
						relations.set(attributes.Id, {
							target: resolvePart(attributes.Target),
							type: attributes.Type ?? ''
						});
					}
				}
			})
		);
	}

	let firstSheetId: string | undefined;
	const workbookEntry = entries.get('xl/workbook.xml');
	if (workbookEntry) {
		await drain(
			parseXml(zip, workbookEntry, {
				open: (name, attributes) => {
					if (name === 'sheet' && firstSheetId === undefined) {
						firstSheetId = Object.entries(attributes).find(
							([key]) => key === 'id' || key.endsWith(':id')
						)?.[1];
					}
				}
			})
		);
	}

	const sheetPath =
		(firstSheetId && relations.get(firstSheetId)?.target) ||
		'xl/worksheets/sheet1.xml';
	const sheet = entries.get(sheetPath);
	if (!sheet) {
		throw new ExcelFileError('В Excel-файле нет листов');
	}

	const sharedStringsPath =
		[...relations.values()].find((rel) => rel.type.endsWith('/sharedStrings'))
			?.target ?? 'xl/sharedStrings.xml';
	return { sheet, sharedStrings: entries.get(sharedStringsPath) };
}

// Target связи относительно xl/ или абсолютный от корня архива
function resolvePart(target: string) {
	return target.startsWith('/')
		? target.slice(1)
		: path.posix.normalize(path.posix.join('xl', target));
}

// xl/sharedStrings.xml: <si> с текстом в <t> (или в нескольких <r><t> — rich text);
// <rPh> — фонетическая подсказка, в значение не входит
async function readSharedStrings(zip: ZipFile, entry: Entry): Promise<string[]> {
	const strings: string[] = [];
	let current = '';
	let inPhonetic = 0;
	let capture = false;
	await drain(
		parseXml(zip, entry, {
			open: (name) => {
				if (name === 'si') current = '';
				else if (name === 'rPh') inPhonetic++;
				else if (name === 't' && !inPhonetic) capture = true;
			},
			close: (name) => {
				if (name === 'si') strings.push(current);
				else if (name === 'rPh') inPhonetic--;
				else if (name === 't') capture = false;
			},
			text: (text) => {
				if (capture) current += text;
			}
		})
	);
	return strings;
}

// Лист: <row r="N"><c r="B3" t="s|str|inlineStr|b|e|n"><v>…</v> или <is><t>…</t></is></c>
function readWorksheet(
	zip: ZipFile,
	entry: Entry,
	strings: string[],
	limits: ExcelLimits
): AsyncGenerator<SheetRow> {
	const ready: SheetRow[] = [];
	let rowCount = 0;
	let rowNumber = 0;
	let values: CellValue[] = [];
	let nextColumn = 0;

	let column = 0;
	let type = 'n';
	let raw = '';
	let hasValue = false;
	let capture = false;
	let inPhonetic = 0;

	const fail = (message: string) => {
		throw new ExcelFileError(`Строка ${rowNumber}: ${message}`);
	};

	const cellValue = (): CellValue => {
		if (!hasValue) return undefined;
		switch (type) {
			case 's': {
				const index = Number(raw);
				if (!Number.isInteger(index) || index < 0 || index >= strings.length) {
					fail('ссылка на несуществующую строку в sharedStrings');
				}
				return strings[index];
			}
			case 'str':
			case 'inlineStr':
			case 'd':
				return raw;
			case 'b':
				return raw.trim() === '1' || raw.trim() === 'true';
			case 'e':
				return undefined; // #N/A, #REF! и т.п.
			default: {
				const text = raw.trim();
				if (text === '') return undefined;
				const number = Number(text);
				return Number.isNaN(number) ? text : number;
			}
		}
	};

	return parseXml<SheetRow>(zip, entry, {
		open: (name, attributes) => {
			switch (name) {
				case 'row':
					rowNumber = Number(attributes.r) || rowNumber + 1;
					values = [];
					nextColumn = 0;
					break;
				case 'c':
					column = attributes.r ? columnIndex(attributes.r) : nextColumn;
					if (column < 0) fail(`неверный адрес ячейки «${attributes.r}»`);
					if (column >= limits.maxColumns) {
						fail(`больше ${limits.maxColumns} колонок`);
					}
					type = attributes.t ?? 'n';
					raw = '';
					hasValue = false;
					break;
				case 'v':
					capture = true;
					hasValue = true;
					break;
				case 'rPh':
					inPhonetic++;
					break;
				case 't':
					// текст inline-строки: <c t="inlineStr"><is><t>…</t></is></c>
					if (type === 'inlineStr' && !inPhonetic) {
						capture = true;
						hasValue = true;
					}
					break;
			}
		},
		close: (name) => {
			switch (name) {
				case 'v':
				case 't':
					capture = false;
					break;
				case 'rPh':
					inPhonetic--;
					break;
				case 'c': {
					const value = cellValue();
					if (
						typeof value === 'string' &&
						value.length > limits.maxCellLength
					) {
						fail(`в ячейке больше ${limits.maxCellLength} символов`);
					}
					values[column] = value;
					nextColumn = column + 1;
					break;
				}
				case 'row': {
					const row = Array.from(values); // дырки → undefined
					if (row.every((value) => value === undefined || value === '')) break;
					if (++rowCount > limits.maxRows) {
						throw new ExcelFileError(
							`В файле больше ${limits.maxRows} строк — разбейте выгрузку на части`
						);
					}
					ready.push({ number: rowNumber, values: row });
					break;
				}
			}
		},
		text: (text) => {
			if (capture) {
				raw += text;
				if (raw.length > limits.maxCellLength) {
					fail(`в ячейке больше ${limits.maxCellLength} символов`);
				}
			}
		},
		emit: () => ready.splice(0)
	});
}

// «B12» → 1; не адрес — −1
function columnIndex(reference: string): number {
	const letters = /^([A-Z]{1,3})\d*$/i.exec(reference)?.[1];
	if (!letters) return -1;
	let index = 0;
	for (const letter of letters.toUpperCase()) {
		index = index * 26 + (letter.charCodeAt(0) - 64);
	}
	return index <= MAX_EXCEL_COLUMNS ? index - 1 : -1;
}

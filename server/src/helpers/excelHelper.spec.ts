import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import ExcelJS from 'exceljs';
import yauzl from 'yauzl';
import {
	cellRef,
	excelLikeXlsx,
	MAIN,
	rawXlsx,
	sharedStringsXml,
	sheetXml,
	workbookRels,
	workbookXml
} from '../../test/xlsx';
import {
	buildXlsx,
	DEFAULT_EXCEL_LIMITS,
	ExcelFileError,
	ExcelLimits,
	readSheet,
	readSheetRows,
	SheetRow,
	XlsxSource
} from './excelHelper';

const repo = (...parts: string[]) => path.resolve(process.cwd(), '..', ...parts);

const limits = (overrides: Partial<ExcelLimits>) => ({
	...DEFAULT_EXCEL_LIMITS,
	...overrides
});

// Только первая строка — генератор закрывается досрочно (как break в цикле)
async function firstRowOnly(source: XlsxSource) {
	const rows = readSheetRows(source);
	const first = await rows.next();
	await rows.return(undefined);
	return first.value as SheetRow | undefined;
}

async function rowsOf(source: XlsxSource, options?: ExcelLimits) {
	const rows: SheetRow[] = [];
	for await (const row of readSheetRows(source, options)) rows.push(row);
	return rows;
}

// Книга из одного листа с заданным XML строк (без префикса пространства имён)
function oneSheet(rows: string, strings?: string[]) {
	return rawXlsx([
		['xl/workbook.xml', workbookXml([{ name: 'Лист1', id: 'rId1' }], '')],
		[
			'xl/_rels/workbook.xml.rels',
			workbookRels(
				[{ id: 'rId1', target: 'worksheets/sheet1.xml' }],
				strings ? 'sharedStrings.xml' : null
			)
		],
		...(strings
			? ([['xl/sharedStrings.xml', sharedStringsXml(strings)]] as [
					string,
					string
				][])
			: []),
		['xl/worksheets/sheet1.xml', sheetXml(rows)]
	]);
}

// Значения первой ячейки A1 для XML ячейки
async function a1(cell: string, strings?: string[]) {
	const [row] = await readSheet(await oneSheet(`<row r="1">${cell}</row>`, strings));
	return row?.[0];
}

describe('excelHelper', () => {
	let dir: string;

	beforeAll(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'excel-'));
	});

	afterAll(async () => {
		await fs.rm(dir, { recursive: true, force: true });
	});

	async function file(name: string, content: Buffer | Promise<Buffer>) {
		const target = path.join(dir, name);
		await fs.writeFile(target, await content);
		return target;
	}

	describe('значения ячеек', () => {
		it.each([
			['число', '<c r="A1"><v>1990</v></c>', 1990],
			['дробь', '<c r="A1"><v>3579.03</v></c>', 3579.03],
			['отрицательное', '<c r="A1"><v>-12.5</v></c>', -12.5],
			['экспонента', '<c r="A1"><v>1.5E+3</v></c>', 1500],
			[
				'штрихкод EAN-13 без потери точности',
				'<c r="A1"><v>8422091144289</v></c>',
				8422091144289
			],
			[
				'Excel-дата остаётся серийным номером («3/4»)',
				'<c r="A1" s="5"><v>45750</v></c>',
				45750
			],
			['t="n" явно', '<c r="A1" t="n"><v>7</v></c>', 7],
			['число с пробелами вокруг', '<c r="A1"><v> 42 </v></c>', 42],
			['нечисловой текст в числовой ячейке', '<c r="A1"><v>abc</v></c>', 'abc'],
			['пустой <v/>', '<c r="A1"><v/></c>', undefined],
			['ячейка только со стилем', '<c r="A1" s="3"/>', undefined],
			['логическое 1', '<c r="A1" t="b"><v>1</v></c>', true],
			['логическое 0', '<c r="A1" t="b"><v>0</v></c>', false],
			['ошибка #N/A', '<c r="A1" t="e"><v>#N/A</v></c>', undefined],
			['ошибка #REF!', '<c r="A1" t="e"><v>#REF!</v></c>', undefined],
			[
				'формула: берётся сохранённый результат',
				'<c r="A1"><f>SUM(B1:B3)</f><v>6</v></c>',
				6
			],
			['формула без результата', '<c r="A1"><f>NOW()</f></c>', undefined],
			[
				'строковая формула',
				'<c r="A1" t="str"><f>B1&amp;C1</f><v>итог</v></c>',
				'итог'
			],
			[
				'дата ISO (t="d")',
				'<c r="A1" t="d"><v>2026-10-24T00:00:00</v></c>',
				'2026-10-24T00:00:00'
			],
			[
				'inline-строка',
				'<c r="A1" t="inlineStr"><is><t>Бежевый</t></is></c>',
				'Бежевый'
			],
			[
				'inline rich text из нескольких частей',
				'<c r="A1" t="inlineStr"><is><r><t>Бе</t></r><r><rPr><b/></rPr><t>жевый</t></r></is></c>',
				'Бежевый'
			],
			[
				'XML-сущности и ссылки на символы',
				'<c r="A1" t="inlineStr"><is><t>A &amp; B &lt;1&gt; &#1044;&#x418;</t></is></c>',
				'A & B <1> ДИ'
			],
			[
				'CDATA',
				'<c r="A1" t="inlineStr"><is><t><![CDATA[<b>как есть</b>]]></t></is></c>',
				'<b>как есть</b>'
			],
			[
				'пробелы и переводы строк сохраняются',
				'<c r="A1" t="inlineStr"><is><t xml:space="preserve">  а\nб  </t></is></c>',
				'  а\nб  '
			],
			[
				'эмодзи (4-байтовый UTF-8)',
				'<c r="A1" t="inlineStr"><is><t>👙 купальник</t></is></c>',
				'👙 купальник'
			]
		])('%s', async (_, cell, expected) => {
			expect(await a1(cell)).toEqual(expected);
		});

		it('общие строки: обычная, rich text, фонетика не входит в значение, пустая', async () => {
			const buffer = await rawXlsx([
				['xl/workbook.xml', workbookXml([{ name: 'Лист1', id: 'rId1' }], '')],
				[
					'xl/_rels/workbook.xml.rels',
					workbookRels([{ id: 'rId1', target: 'worksheets/sheet1.xml' }])
				],
				[
					'xl/sharedStrings.xml',
					`<sst xmlns="${MAIN}"><si><t>Avena</t></si>` +
						`<si><r><t>Бе</t></r><r><rPr><i/></rPr><t xml:space="preserve">жевый </t></r></si>` +
						`<si><t>漢字</t><rPh sb="0" eb="2"><t>かんじ</t></rPh></si>` +
						`<si><t/></si></sst>`
				],
				[
					'xl/worksheets/sheet1.xml',
					sheetXml(
						'<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1"><v>1</v></c></row>'
					)
				]
			]);
			expect(await readSheet(buffer)).toEqual([
				['Avena', 'Бежевый ', '漢字', '', 1]
			]);
		});
	});

	describe('строки и колонки', () => {
		it('номер строки берётся из r, пустые строки пропускаются, но нумерацию не сбивают', async () => {
			const rows = await rowsOf(
				await oneSheet(
					'<row r="2"><c r="A2"><v>1</v></c></row>' +
						'<row r="3"></row>' +
						'<row r="4"><c r="A4" s="1"/><c r="B4" t="inlineStr"><is><t></t></is></c></row>' +
						'<row r="10"><c r="A10"><v>2</v></c></row>'
				)
			);
			expect(rows).toEqual([
				{ number: 2, values: [1] },
				{ number: 10, values: [2] }
			]);
		});

		it('строки и ячейки без r: номера и колонки идут подряд', async () => {
			const rows = await rowsOf(
				await oneSheet(
					'<row><c><v>1</v></c><c><v>2</v></c></row>' +
						'<row><c><v>3</v></c><c r="D2"><v>4</v></c><c><v>5</v></c></row>'
				)
			);
			expect(rows).toEqual([
				{ number: 1, values: [1, 2] },
				{ number: 2, values: [3, undefined, undefined, 4, 5] }
			]);
		});

		it('пропущенные ячейки — undefined, хвост строки не дописывается', async () => {
			const [row] = await readSheet(
				await oneSheet(
					'<row r="1"><c r="B1"><v>1</v></c><c r="E1"><v>2</v></c></row>'
				)
			);
			expect(row).toEqual([undefined, 1, undefined, undefined, 2]);
			expect(row).toHaveLength(5);
			expect(Object.keys(row)).toHaveLength(5); // без «дырок» в массиве
		});

		it.each([
			['Z1', 25],
			['AA1', 26],
			['AZ1', 51],
			['BA1', 52],
			['GZ1', 207]
		])('адрес %s → колонка %d', async (ref, index) => {
			const [row] = await readSheet(
				await oneSheet(`<row r="1"><c r="${ref}"><v>1</v></c></row>`),
				limits({ maxColumns: 300 })
			);
			expect(row).toHaveLength(index + 1);
			expect(row[index]).toBe(1);
		});

		it('адрес в нижнем регистре тоже понимается', async () => {
			const [row] = await readSheet(
				await oneSheet('<row r="1"><c r="c1"><v>1</v></c></row>')
			);
			expect(row).toEqual([undefined, undefined, 1]);
		});

		it('пустой лист и лист без sheetData → нет строк', async () => {
			expect(await readSheet(await oneSheet(''))).toEqual([]);
			const noData = await rawXlsx([
				['xl/worksheets/sheet1.xml', `<worksheet xmlns="${MAIN}"/>`]
			]);
			expect(await readSheet(noData)).toEqual([]);
		});
	});

	describe('структура книги', () => {
		it('первый лист — по порядку в workbook.xml, а не по имени файла', async () => {
			const buffer = await rawXlsx([
				[
					'xl/worksheets/sheet1.xml',
					sheetXml('<row r="1"><c r="A1"><v>1</v></c></row>')
				],
				[
					'xl/worksheets/sheet3.xml',
					sheetXml('<row r="1"><c r="A1"><v>3</v></c></row>')
				],
				[
					'xl/_rels/workbook.xml.rels',
					workbookRels(
						[
							{ id: 'rId1', target: 'worksheets/sheet1.xml' },
							{ id: 'rId3', target: 'worksheets/sheet3.xml' }
						],
						null
					)
				],
				[
					'xl/workbook.xml',
					workbookXml([
						{ name: 'Главный', id: 'rId3' },
						{ name: 'Второй', id: 'rId1' }
					])
				]
			]);
			expect(await readSheet(buffer)).toEqual([[3]]);
		});

		it('абсолютный путь в связи (/xl/…) и префиксы пространств имён', async () => {
			const buffer = await rawXlsx([
				['xl/workbook.xml', workbookXml([{ name: 'Данные', id: 'r7' }], 'x')],
				[
					'xl/_rels/workbook.xml.rels',
					workbookRels(
						[{ id: 'r7', target: '/xl/worksheets/data.xml' }],
						'/xl/strings.xml'
					)
				],
				['xl/strings.xml', sharedStringsXml(['из нестандартного пути'])],
				[
					'xl/worksheets/data.xml',
					sheetXml(
						'<x:row r="1"><x:c r="A1" t="s"><x:v>0</x:v></x:c></x:row>',
						'x'
					)
				]
			]);
			expect(await readSheet(buffer)).toEqual([['из нестандартного пути']]);
		});

		it('без workbook.xml и связей — берётся xl/worksheets/sheet1.xml и xl/sharedStrings.xml', async () => {
			const buffer = await rawXlsx([
				['xl/sharedStrings.xml', sharedStringsXml(['a'])],
				[
					'xl/worksheets/sheet1.xml',
					sheetXml('<row r="1"><c r="A1" t="s"><v>0</v></c></row>')
				]
			]);
			expect(await readSheet(buffer)).toEqual([['a']]);
		});

		it('раскладка Excel (листы раньше sharedStrings, workbook.xml в конце)', async () => {
			const rows = [
				['Код', 'Цвет', 'Цена'],
				['A-1', 'Avena', 1990],
				['A-2', 'Дикий_имбирь/Белая_роза', 990.5]
			];
			expect(await readSheet(await excelLikeXlsx(rows))).toEqual(rows);
		});

		it('ссылка на общую строку без sharedStrings.xml — ошибка с номером строки', async () => {
			await expect(
				readSheet(await oneSheet('<row r="3"><c r="A3" t="s"><v>0</v></c></row>'))
			).rejects.toThrow(/Строка 3: ссылка на несуществующую строку/);
		});

		it.each(['5', '-1', '1.5', 'abc'])(
			'неверный индекс общей строки «%s» — ошибка',
			async (index) => {
				await expect(
					readSheet(
						await oneSheet(
							`<row r="7"><c r="A7" t="s"><v>${index}</v></c></row>`,
							['a']
						)
					)
				).rejects.toThrow(/Строка 7: ссылка на несуществующую строку/);
			}
		);

		it('нет ни одного листа', async () => {
			const buffer = await rawXlsx([['xl/workbook.xml', workbookXml([])]]);
			await expect(readSheet(buffer)).rejects.toThrow(/нет листов/);
		});

		it('связь указывает на отсутствующий лист', async () => {
			const buffer = await rawXlsx([
				['xl/workbook.xml', workbookXml([{ name: 'Лист1', id: 'rId1' }])],
				[
					'xl/_rels/workbook.xml.rels',
					workbookRels([{ id: 'rId1', target: 'worksheets/nope.xml' }], null)
				]
			]);
			await expect(readSheet(buffer)).rejects.toThrow(/нет листов/);
		});
	});

	describe('поток', () => {
		it('путь к файлу и Buffer дают одинаковый результат', async () => {
			const buffer = await excelLikeXlsx([
				['a', 1],
				['б', 2]
			]);
			const target = await file('same.xlsx', buffer);
			expect(await readSheet(target)).toEqual(await readSheet(buffer));
		});

		it('кириллица и эмодзи на границах чанков не ломаются', async () => {
			const rows = Array.from({ length: 5000 }, (_, i) => [
				`Дикий_имбирь/Белая_роза №${i} ёжик 👙`,
				i
			]);
			const read = await readSheet(
				await file('utf8.xlsx', buildXlsx('Лист1', rows))
			);
			expect(read.filter(([value]) => String(value).includes('�'))).toEqual([]);
			expect(read).toEqual(rows);
		});

		it('то же для inline-строк в одном большом листе без sharedStrings', async () => {
			const body = Array.from(
				{ length: 3000 },
				(_, i) =>
					`<row r="${i + 1}"><c r="A${i + 1}" t="inlineStr"><is><t>Шёлковица ${i} — ✓</t></is></c></row>`
			).join('');
			const read = await readSheet(await oneSheet(body));
			expect(read).toHaveLength(3000);
			expect(read.every(([value], i) => value === `Шёлковица ${i} — ✓`)).toBe(true);
		});

		// В exceljs 4.4 повторные чтения после большого файла теряли xl/workbook.xml
		it('повторные чтения подряд стабильны, в т.ч. прерванные лимитом', async () => {
			const big = await file(
				'big.xlsx',
				buildXlsx(
					'Лист1',
					Array.from({ length: 5000 }, (_, i) => [`строка ${i}`])
				)
			);
			const small = await file(
				'small.xlsx',
				buildXlsx('Лист1', [['a', 'b', 'c', 'd'], ['x'], ['y']])
			);
			for (let i = 0; i < 3; i++) {
				expect(await readSheet(big)).toHaveLength(5000);
				await expect(readSheet(small, limits({ maxRows: 2 }))).rejects.toThrow(
					/больше 2 строк/
				);
				expect(await readSheet(small)).toHaveLength(3);
			}
		});

		it('параллельные чтения не мешают друг другу', async () => {
			const a = await file(
				'par-a.xlsx',
				excelLikeXlsx(Array.from({ length: 2000 }, (_, i) => [`a${i}`]))
			);
			const b = await file(
				'par-b.xlsx',
				buildXlsx(
					'Лист1',
					Array.from({ length: 2000 }, (_, i) => [`b${i}`])
				)
			);
			const [ra, rb] = await Promise.all([readSheet(a), readSheet(b)]);
			expect(ra.at(-1)).toEqual(['a1999']);
			expect(rb.at(-1)).toEqual(['b1999']);
		});

		describe('архив закрывается всегда', () => {
			let close: ReturnType<typeof vi.spyOn>;
			let target: string;

			beforeAll(async () => {
				target = await file(
					'close.xlsx',
					buildXlsx(
						'Лист1',
						Array.from({ length: 5000 }, (_, i) => [i])
					)
				);
			});

			beforeEach(() => {
				close = vi.spyOn(yauzl.ZipFile.prototype, 'close');
			});

			afterEach(() => {
				close.mockRestore();
			});

			it('после чтения до конца', async () => {
				expect(await readSheet(target)).toHaveLength(5000);
				expect(close).toHaveBeenCalledTimes(1);
			});

			it('при досрочном выходе из цикла', async () => {
				let seen = 0;
				for await (const row of readSheetRows(target)) {
					seen = row.number;
					if (seen === 3) break;
				}
				expect(seen).toBe(3);
				expect(close).toHaveBeenCalledTimes(1);
			});

			it('при ошибке лимита', async () => {
				await expect(
					readSheet(target, limits({ maxRows: 10 }))
				).rejects.toThrow();
				expect(close).toHaveBeenCalledTimes(1);
			});

			it('при ошибке в обработчике строки', async () => {
				const consume = async () => {
					for await (const row of readSheetRows(target))
						throw new Error(`обработчик ${row.number}`);
				};
				await expect(consume()).rejects.toThrow('обработчик 1');
				expect(close).toHaveBeenCalledTimes(1);
			});

			it('после удаления файл действительно отпущен', async () => {
				await firstRowOnly(target);
				await expect(fs.unlink(target)).resolves.toBeUndefined();
			});
		});

		it('ошибка обработчика строки пробрасывается как есть, а не как ошибка формата', async () => {
			const buffer = await excelLikeXlsx([[1], [2]]);
			class HandlerError extends Error {}
			const consume = async () => {
				for await (const row of readSheetRows(buffer)) {
					if (row.number === 2) throw new HandlerError('строка 2');
				}
			};
			await expect(consume()).rejects.toBeInstanceOf(HandlerError);
		});

		it('строки отдаются лениво: первая строка большого файла — без разбора всего листа', async () => {
			const target = await file(
				'lazy.xlsx',
				buildXlsx(
					'Лист1',
					Array.from({ length: 60_000 }, (_, i) => [`строка ${i}`, i])
				)
			);
			let started = performance.now();
			await readSheet(target);
			const full = performance.now() - started;

			started = performance.now();
			await firstRowOnly(target);
			const first = performance.now() - started;
			expect(first).toBeLessThan(full / 2);
		});
	});

	describe('реальные файлы из репозитория', () => {
		it('выгрузка поставщика shel_data_new.xlsx: все 35 830 строк, заголовок и значения', async () => {
			const rows = await readSheet(repo('temp-dev', 'shel_data_new.xlsx'));
			expect(rows).toHaveLength(35_830);
			expect(rows[0]).toHaveLength(19);
			expect(rows[0].slice(0, 9)).toEqual([
				'Код',
				'Категория',
				'Тип',
				'Торговая марка',
				'Цвет',
				'Фото цвета',
				'Размер',
				'Цена',
				'Штрих-код'
			]);
			expect(rows[1].slice(0, 9)).toEqual([
				'1025612Брк-ммр',
				'Верхний трикотаж',
				'Брюки',
				'Janira',
				'Marine',
				'https://darsitrade.ru/import/images/cjan_egeo.jpg',
				'M',
				'3579.03',
				8422091144289
			]);
			expect(rows.at(-1)?.[0]).toBe('3фксиЮ24о-мчс');
			// детские размеры, которые Excel превратил в даты
			expect(rows.find((r) => r[0] === '339дбПиждо-4гм')?.[6]).toBe(45750);
			expect(rows.some((r) => r.some((v) => String(v).includes('�')))).toBe(false);
		});

		it('короткая выгрузка: испорченные Excel штрихкоды читаются как текст «8,42209E+12»', async () => {
			const rows = await readSheet(repo('temp-dev', 'shell_data_short.xlsx'));
			expect(rows).toHaveLength(10);
			expect(new Set(rows.map((r) => r[8]))).toEqual(new Set(['8,42209E+12']));
		});

		it('старая выгрузка shel_data.xlsx (другая раскладка архива)', async () => {
			const rows = await readSheet(repo('temp-dev', 'shel_data.xlsx'));
			expect(rows).toHaveLength(11);
			expect(rows[0]).toEqual(['MGN-0068418    ', 16, 'белый', 'шир.40', 15, 230]);
		});

		it('справочники colors.xlsx и sizes.xlsx', async () => {
			const colors = await readSheet(path.resolve('data', 'colors.xlsx'));
			expect(colors).toHaveLength(890);
			expect(colors).toContainEqual(['Avena', 'бежевый']);
			const sizes = await readSheet(path.resolve('data', 'sizes.xlsx'));
			expect(sizes).toHaveLength(385);
			expect(sizes.slice(0, 3)).toEqual([
				[1, 40],
				[2, 42],
				[3, 44]
			]);
		});

		it('фикстура Postman tests/fixtures/import.xlsx', async () => {
			const rows = await readSheet(repo('tests', 'fixtures', 'import.xlsx'));
			expect(rows).toHaveLength(3);
			expect(rows[2][18]).toBe('>5');
		});
	});

	describe('защита', () => {
		it.each([
			['текст', Buffer.from('just text')],
			['пустой файл', Buffer.alloc(0)],
			['PNG', Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')],
			[
				'старый .xls (OLE)',
				Buffer.concat([Buffer.from('d0cf11e0a1b11ae1', 'hex'), Buffer.alloc(512)])
			]
		])('%s → «не похож на Excel»', async (_, buffer) => {
			await expect(readSheet(buffer)).rejects.toThrow(/не похож на Excel/);
		});

		it('обрезанный zip отклоняется', async () => {
			const source = await buildXlsx('Лист1', [['A']]);
			await expect(readSheet(source.subarray(0, -30))).rejects.toBeInstanceOf(
				ExcelFileError
			);
		});

		it('испорченные сжатые данные внутри zip отклоняются', async () => {
			const source = Buffer.from(
				await buildXlsx(
					'Лист1',
					Array.from({ length: 200 }, (_, i) => [`строка ${i}`])
				)
			);
			// портим середину архива, не трогая центральный каталог в конце
			source.fill(0x41, 600, 900);
			await expect(readSheet(source)).rejects.toBeInstanceOf(ExcelFileError);
		});

		it.each([
			['незакрытый тег', '<row r="1"><c r="A1"><v>1</v></c>'],
			['лишний закрывающий тег', '<row r="1"></c></row>'],
			[
				'неэкранированный &',
				'<row r="1"><c r="A1" t="inlineStr"><is><t>A & B</t></is></c></row>'
			]
		])('битый XML листа (%s) → ошибка формата', async (_, rows) => {
			await expect(readSheet(await oneSheet(rows))).rejects.toThrow(
				/Не удалось прочитать Excel/
			);
		});

		it('DOCTYPE с сущностями (billion laughs, XXE) не раскрывается', async () => {
			const doctype =
				'<!DOCTYPE x [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;"><!ENTITY xxe SYSTEM "file:///etc/passwd">]>';
			for (const entity of ['&b;', '&xxe;']) {
				const buffer = await rawXlsx([
					[
						'xl/worksheets/sheet1.xml',
						`${doctype}<worksheet xmlns="${MAIN}"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>${entity}</t></is></c></row></sheetData></worksheet>`
					]
				]);
				await expect(readSheet(buffer)).rejects.toThrow(/undefined entity/);
			}
		});

		it('адрес ячейки за пределами Excel (после XFD) или мусор', async () => {
			await expect(
				readSheet(
					await oneSheet('<row r="1"><c r="XFE1"><v>1</v></c></row>'),
					limits({ maxColumns: 20_000 })
				)
			).rejects.toThrow(/Строка 1: неверный адрес ячейки «XFE1»/);
			await expect(
				readSheet(await oneSheet('<row r="1"><c r="1A"><v>1</v></c></row>'))
			).rejects.toThrow(/неверный адрес ячейки/);
		});

		it('размер после распаковки', async () => {
			await expect(
				readSheet(
					await buildXlsx('Лист1', [['A']]),
					limits({ maxUncompressedBytes: 1000 })
				)
			).rejects.toThrow(/после распаковки/);
		});

		it('количество файлов в архиве', async () => {
			await expect(
				readSheet(await buildXlsx('Лист1', [['A']]), limits({ maxEntries: 3 }))
			).rejects.toThrow(/Слишком много файлов/);
		});

		it('zip-бомба: мегабайты нулей, сжатые в килобайты', async () => {
			const padding = `<!--${' '.repeat(20 * 1024 * 1024)}-->`;
			const buffer = await rawXlsx([
				[
					'xl/worksheets/sheet1.xml',
					`${sheetXml('<row r="1"><c r="A1"><v>1</v></c></row>')}${padding}`
				]
			]);
			expect(buffer.length).toBeLessThan(100 * 1024);
			await expect(readSheet(buffer)).rejects.toThrow(/zip-бомба/);
		});

		it('сильно сжатые маленькие части (до 1 МБ) — допустимы', async () => {
			const padding = `<!--${' '.repeat(900 * 1024)}-->`;
			const buffer = await rawXlsx([
				[
					'xl/worksheets/sheet1.xml',
					`${sheetXml('<row r="1"><c r="A1"><v>1</v></c></row>')}${padding}`
				]
			]);
			expect(await readSheet(buffer)).toEqual([[1]]);
		});

		it('степень сжатия настраивается', async () => {
			const same = Array.from({ length: 30_000 }, () => ['одно и то же', 1]);
			const target = await file('ratio.xlsx', buildXlsx('Лист1', same));
			expect(await readSheet(target)).toHaveLength(30_000);
			await expect(
				readSheet(target, limits({ maxCompressionRatio: 3 }))
			).rejects.toThrow(/zip-бомба/);
		});

		it('строки: лимит считает только непустые', async () => {
			const buffer = await oneSheet(
				'<row r="1"><c r="A1"><v>1</v></c></row><row r="2"/><row r="3"><c r="A3" s="1"/></row><row r="4"><c r="A4"><v>2</v></c></row>'
			);
			expect(await readSheet(buffer, limits({ maxRows: 2 }))).toEqual([[1], [2]]);
			await expect(readSheet(buffer, limits({ maxRows: 1 }))).rejects.toThrow(
				/больше 1 строк — разбейте выгрузку/
			);
		});

		it('колонки: лимит по адресу самой дальней ячейки', async () => {
			const buffer = await oneSheet(
				'<row r="5"><c r="A5"><v>1</v></c><c r="E5"><v>2</v></c></row>'
			);
			expect(await readSheet(buffer, limits({ maxColumns: 5 }))).toEqual([
				[1, undefined, undefined, undefined, 2]
			]);
			await expect(readSheet(buffer, limits({ maxColumns: 4 }))).rejects.toThrow(
				/Строка 5: больше 4 колонок/
			);
		});

		it.each([
			[
				'общая строка',
				(text: string) =>
					oneSheet('<row r="2"><c r="A2" t="s"><v>0</v></c></row>', [text])
			],
			[
				'inline-строка',
				(text: string) =>
					oneSheet(
						`<row r="2"><c r="A2" t="inlineStr"><is><t>${text}</t></is></c></row>`
					)
			],
			[
				'число-текст',
				(text: string) =>
					oneSheet(`<row r="2"><c r="A2"><v>${text}</v></c></row>`)
			]
		])('длина ячейки (%s)', async (_, build) => {
			const ok = await build('x'.repeat(5));
			expect(await readSheet(ok, limits({ maxCellLength: 5 }))).toHaveLength(1);
			const tooLong = await build('x'.repeat(6));
			await expect(
				readSheet(tooLong, limits({ maxCellLength: 5 }))
			).rejects.toThrow(/Строка 2: в ячейке больше 5 символов/);
		});

		it('лимиты по умолчанию пропускают реальную выгрузку с запасом', () => {
			expect(DEFAULT_EXCEL_LIMITS.maxRows).toBeGreaterThan(35_830 * 2);
			expect(DEFAULT_EXCEL_LIMITS.maxColumns).toBeGreaterThan(19 * 5);
			expect(DEFAULT_EXCEL_LIMITS.maxUncompressedBytes).toBeGreaterThan(
				31_631_692 * 5
			);
		});
	});

	describe('buildXlsx', () => {
		it('значения переживают запись и чтение', async () => {
			const rows = [
				['текст', 1990, 3579.03, -1, 8422091144289, true, false],
				[
					'Дикий_имбирь/Белая_роза 👙',
					0,
					'',
					'строка с\nпереводом',
					'  пробелы  '
				]
			];
			const read = await readSheet(await buildXlsx('Ошибки', rows));
			expect(read[0]).toEqual(rows[0]);
			expect(read[1]).toEqual([
				'Дикий_имбирь/Белая_роза 👙',
				0,
				'',
				'строка с\nпереводом',
				'  пробелы  '
			]);
		});

		it('null, undefined → пустая ячейка; объекты и даты → текст', async () => {
			const [row] = await readSheet(
				await buildXlsx('Лист1', [
					[null, 'a', undefined, { x: 1 }, new Error('сбой')]
				])
			);
			expect(row).toEqual([
				undefined,
				'a',
				undefined,
				'[object Object]',
				'Error: сбой'
			]);
		});

		it('пустой список строк → валидный файл без строк', async () => {
			expect(await readSheet(await buildXlsx('Ошибок нет', []))).toEqual([]);
		});

		it('имя листа сохраняется', async () => {
			const book = new ExcelJS.Workbook();
			await book.xlsx.load(
				(await buildXlsx('Ошибки', [['a']])) as unknown as ArrayBuffer
			);
			expect(book.worksheets.map((s) => s.name)).toEqual(['Ошибки']);
		});

		it.each([
			'=HYPERLINK("http://evil","клик")',
			'=1+1',
			'+cmd|"/c calc"!A1',
			'@SUM(1)'
		])('«%s» записывается текстом, а не формулой', async (text) => {
			const book = new ExcelJS.Workbook();
			await book.xlsx.load(
				(await buildXlsx('Ошибки', [[text]])) as unknown as ArrayBuffer
			);
			const cell = book.worksheets[0].getCell('A1');
			expect(cell.type).toBe(ExcelJS.ValueType.String);
			expect(cell.value).toBe(text);
			expect(cell.formula).toBeUndefined();
		});

		it('файл открывается сторонним ридером exceljs и читается нашим одинаково', async () => {
			const rows = Array.from({ length: 50 }, (_, i) => [
				`код ${i}`,
				i,
				i % 2 === 0
			]);
			const buffer = await buildXlsx('Лист1', rows);
			const book = new ExcelJS.Workbook();
			await book.xlsx.load(buffer as unknown as ArrayBuffer);
			const viaExceljs: unknown[][] = [];
			book.worksheets[0].eachRow((row) =>
				viaExceljs.push((row.values as unknown[]).slice(1))
			);
			expect(viaExceljs).toEqual(rows);
			expect(await readSheet(buffer)).toEqual(rows);
		});
	});

	it('cellRef из тестового хелпера совпадает с разбором адреса', async () => {
		for (const column of [0, 25, 26, 51, 701, 702]) {
			const ref = cellRef(column, 1);
			const [row] = await readSheet(
				await oneSheet(`<row r="1"><c r="${ref}"><v>1</v></c></row>`),
				limits({ maxColumns: 1000 })
			);
			expect(row).toHaveLength(column + 1);
		}
	});
});

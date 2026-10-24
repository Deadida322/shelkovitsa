import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import ExcelJS from 'exceljs';
import yazl from 'yazl';
import {
	buildXlsx,
	DEFAULT_EXCEL_LIMITS,
	ExcelFileError,
	ExcelLimits,
	readSheet,
	readSheetRows
} from './excelHelper';

// xlsx из XML-частей в заданном порядке — для форматов, которые exceljs не пишет
function rawXlsx(parts: [string, string][]): Promise<Buffer> {
	const zip = new yazl.ZipFile();
	for (const [name, xml] of parts) zip.addBuffer(Buffer.from(xml), name);
	zip.end();
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		zip.outputStream.on('data', (chunk: Buffer) => chunks.push(chunk));
		zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)));
		zip.outputStream.on('error', reject);
	});
}

const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

const rels = (sheetTarget: string) =>
	`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
	`<Relationship Id="rId1" Type="${REL}/worksheet" Target="${sheetTarget}"/>` +
	`<Relationship Id="rId2" Type="${REL}/sharedStrings" Target="sharedStrings.xml"/>` +
	`</Relationships>`;
const workbook = `<x:workbook xmlns:x="${MAIN}" xmlns:r="${REL}"><x:sheets><x:sheet name="Данные" sheetId="1" r:id="rId1"/></x:sheets></x:workbook>`;
const sheet = (rows: string) =>
	`<x:worksheet xmlns:x="${MAIN}"><x:sheetData>${rows}</x:sheetData></x:worksheet>`;

describe('excelHelper', () => {
	let dir: string;

	beforeAll(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'excel-'));
	});

	afterAll(async () => {
		await fs.rm(dir, { recursive: true, force: true });
	});

	async function file(name: string, rows: unknown[][]) {
		const target = path.join(dir, name);
		await fs.writeFile(target, await buildXlsx('Лист1', rows));
		return target;
	}

	const limits = (overrides: Partial<ExcelLimits>) => ({
		...DEFAULT_EXCEL_LIMITS,
		...overrides
	});

	it('читает строки первого листа, пустые пропускает; Excel-даты остаются числами', async () => {
		const target = await file('rows.xlsx', [
			['Код', 'Размер', 'Штрих-код'],
			[],
			['A-1', 45750, 8422091144289]
		]);
		const rows = [];
		for await (const row of readSheetRows(target)) rows.push(row);
		expect(rows).toEqual([
			{ number: 1, values: ['Код', 'Размер', 'Штрих-код'] },
			{ number: 3, values: ['A-1', 45750, 8422091144289] }
		]);
	});

	it('кириллица на границах чанков потока не ломается', async () => {
		const rows = Array.from({ length: 5000 }, (_, i) => [
			`Дикий_имбирь/Белая_роза №${i} ёжик`
		]);
		const read = await readSheet(await file('utf8.xlsx', rows));
		expect(read.filter(([value]) => String(value).includes('�'))).toEqual([]);
		expect(read).toEqual(rows);
	});

	// В exceljs 4.4 повторные чтения после большого файла теряли xl/workbook.xml
	it('повторные чтения подряд стабильны, в т.ч. прерванные лимитом', async () => {
		const big = await file(
			'big.xlsx',
			Array.from({ length: 5000 }, (_, i) => [`строка ${i}`])
		);
		const small = await file('small.xlsx', [['a', 'b', 'c', 'd'], ['x'], ['y']]);
		for (let i = 0; i < 3; i++) {
			expect(await readSheet(big)).toHaveLength(5000);
			await expect(readSheet(small, limits({ maxRows: 2 }))).rejects.toThrow(
				/больше 2 строк/
			);
			expect(await readSheet(small)).toHaveLength(3);
		}
	});

	it('файл ошибок читается обратно из Buffer', async () => {
		const buffer = await buildXlsx('Ошибки', [['A-1', '', 'нет цвета']]);
		expect(await readSheet(buffer)).toEqual([['A-1', '', 'нет цвета']]);
	});

	it('строка с «=» записывается текстом, а не формулой', async () => {
		const buffer = await buildXlsx('Ошибки', [['=HYPERLINK("http://evil")']]);
		const book = new ExcelJS.Workbook();
		await book.xlsx.load(buffer as unknown as ArrayBuffer);
		const cell = book.worksheets[0].getCell('A1');
		expect(cell.type).toBe(ExcelJS.ValueType.String);
		expect(cell.value).toBe('=HYPERLINK("http://evil")');
	});

	it('форматы ячеек: общие и inline-строки, rich text, формулы, логические, ошибки', async () => {
		const buffer = await rawXlsx([
			// как сохраняет Excel: листы раньше sharedStrings, workbook.xml — в конце
			['xl/_rels/workbook.xml.rels', rels('worksheets/sheet2.xml')],
			[
				'xl/worksheets/sheet1.xml',
				sheet('<x:row r="1"><x:c r="A1"><x:v>999</x:v></x:c></x:row>')
			],
			[
				'xl/worksheets/sheet2.xml',
				sheet(
					'<x:row r="1"><x:c r="A1" t="s"><x:v>0</x:v></x:c><x:c r="C1" t="inlineStr"><x:is><x:t>inline</x:t></x:is></x:c></x:row>' +
						'<x:row><x:c t="b"><x:v>1</x:v></x:c><x:c t="e"><x:v>#N/A</x:v></x:c><x:c><x:f>1+1</x:f><x:v>2</x:v></x:c><x:c t="str"><x:f>A1</x:f><x:v>текст</x:v></x:c></x:row>' +
						'<x:row r="4"><x:c r="A4" s="1"/></x:row>' +
						'<x:row r="5"><x:c r="B5"><x:v>45750</x:v></x:c></x:row>'
				)
			],
			[
				'xl/sharedStrings.xml',
				`<sst xmlns="${MAIN}"><si><r><t>Бе</t></r><r><t xml:space="preserve">жевый</t></r><rPh><t>фонетика</t></rPh></si></sst>`
			],
			['xl/workbook.xml', workbook]
		]);

		const rows = [];
		for await (const row of readSheetRows(buffer)) rows.push(row);
		expect(rows).toEqual([
			{ number: 1, values: ['Бежевый', undefined, 'inline'] },
			{ number: 2, values: [true, undefined, 2, 'текст'] },
			{ number: 5, values: [undefined, 45750] }
		]);
	});

	describe('защита', () => {
		it('не-zip отклоняется', async () => {
			await expect(readSheet(Buffer.from('just text'))).rejects.toThrow(
				/не похож на Excel/
			);
		});

		it('обрезанный zip отклоняется', async () => {
			const source = await buildXlsx('Лист1', [['A']]);
			await expect(readSheet(source.subarray(0, -30))).rejects.toBeInstanceOf(
				ExcelFileError
			);
		});

		it('DOCTYPE с сущностями (billion laughs, XXE) не раскрывается', async () => {
			const doctype =
				'<!DOCTYPE x [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;"><!ENTITY xxe SYSTEM "file:///etc/passwd">]>';
			for (const entity of ['&b;', '&xxe;']) {
				const buffer = await rawXlsx([
					['xl/_rels/workbook.xml.rels', rels('worksheets/sheet1.xml')],
					['xl/workbook.xml', workbook],
					[
						'xl/worksheets/sheet1.xml',
						`${doctype}${sheet(`<x:row r="1"><x:c r="A1" t="inlineStr"><x:is><x:t>${entity}</x:t></x:is></x:c></x:row>`)}`
					]
				]);
				await expect(readSheet(buffer)).rejects.toBeInstanceOf(ExcelFileError);
			}
		});

		it('ссылка на несуществующую общую строку', async () => {
			const buffer = await rawXlsx([
				['xl/workbook.xml', workbook],
				['xl/_rels/workbook.xml.rels', rels('worksheets/sheet1.xml')],
				['xl/sharedStrings.xml', `<sst xmlns="${MAIN}"><si><t>a</t></si></sst>`],
				[
					'xl/worksheets/sheet1.xml',
					sheet('<x:row r="7"><x:c r="A7" t="s"><x:v>5</x:v></x:c></x:row>')
				]
			]);
			await expect(readSheet(buffer)).rejects.toThrow(/Строка 7: ссылка/);
		});

		it('нет листов', async () => {
			const buffer = await rawXlsx([['xl/workbook.xml', workbook]]);
			await expect(readSheet(buffer)).rejects.toThrow(/нет листов/);
		});

		it('размер после распаковки', async () => {
			const target = await file('unpacked.xlsx', [['A']]);
			await expect(
				readSheet(target, limits({ maxUncompressedBytes: 1000 }))
			).rejects.toThrow(/после распаковки/);
		});

		it('количество файлов в архиве', async () => {
			const target = await file('entries.xlsx', [['A']]);
			await expect(readSheet(target, limits({ maxEntries: 3 }))).rejects.toThrow(
				/Слишком много файлов/
			);
		});

		it('подозрительно сильное сжатие (zip-бомба)', async () => {
			const same = Array.from({ length: 30_000 }, () => ['одно и то же', 1]);
			const target = await file('bomb.xlsx', same);
			expect(await readSheet(target)).toHaveLength(30_000);
			await expect(
				readSheet(target, limits({ maxCompressionRatio: 3 }))
			).rejects.toThrow(/zip-бомба/);
		});

		it('строки, колонки, длина ячейки', async () => {
			const target = await file('limits.xlsx', [
				['a', 'b', 'c', 'd'],
				['x'.repeat(10)],
				['y']
			]);
			await expect(readSheet(target, limits({ maxRows: 2 }))).rejects.toThrow(
				/больше 2 строк/
			);
			await expect(readSheet(target, limits({ maxColumns: 3 }))).rejects.toThrow(
				/Строка 1: больше 3 колонок/
			);
			await expect(readSheet(target, limits({ maxCellLength: 5 }))).rejects.toThrow(
				/Строка 2: в ячейке больше 5 символов/
			);
		});
	});
});

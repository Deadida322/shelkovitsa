import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { excelLikeXlsx } from '../../test/xlsx';
import { buildXlsx } from 'src/helpers/excelHelper';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import { loadColorMap, loadSizeMap, readMappingFile } from './supplier-format';

describe('файлы преобразования цветов и размеров', () => {
	let dir: string;

	beforeAll(async () => {
		dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mapping-'));
	});

	afterAll(async () => {
		await fs.rm(dir, { recursive: true, force: true });
	});

	async function file(name: string, content: Promise<Buffer>) {
		const target = path.join(dir, name);
		await fs.writeFile(target, await content);
		return target;
	}

	it('пары «у поставщика → в каталоге»: обрезка пробелов, нормализация обеих сторон', async () => {
		const target = await file(
			'colors.xlsx',
			buildXlsx('Лист1', [
				['  avena ', ' бежевый'],
				['Marine', 'синий']
			])
		);
		const map = await readMappingFile(target, capitalizeFirstLetter);
		expect([...map]).toEqual([
			['Avena', 'Бежевый'],
			['Marine', 'Синий']
		]);
	});

	it('числовые размеры (1 → 40) становятся строками', async () => {
		const target = await file(
			'sizes.xlsx',
			buildXlsx('Лист1', [
				[1, 40],
				['xl', 'XL']
			])
		);
		const map = await readMappingFile(target, (v) => v.toUpperCase());
		expect(map.get('1')).toBe('40');
		expect(map.get('XL')).toBe('XL');
	});

	it('строки без пары и пустые пропускаются', async () => {
		const target = await file(
			'partial.xlsx',
			buildXlsx('Лист1', [
				['только слева'],
				[null, 'только справа'],
				[],
				['  ', 'пробелы'],
				['a', 'b']
			])
		);
		const map = await readMappingFile(target, (v) => v);
		expect([...map]).toEqual([['a', 'b']]);
	});

	it('повтор ключа — побеждает последняя строка', async () => {
		const target = await file(
			'dup.xlsx',
			buildXlsx('Лист1', [
				['A', '1'],
				['A', '2']
			])
		);
		expect((await readMappingFile(target, (v) => v)).get('A')).toBe('2');
	});

	it('файл, пересохранённый в Excel (другая раскладка архива), читается так же', async () => {
		const rows = [
			['Avena', 'бежевый'],
			['Дикий_имбирь/Белая_роза', 'розовый'],
			[3, 44]
		];
		const viaExcel = await file('excel.xlsx', excelLikeXlsx(rows));
		const viaExceljs = await file('exceljs.xlsx', buildXlsx('Лист1', rows));
		expect([...(await readMappingFile(viaExcel, (v) => v))]).toEqual([
			...(await readMappingFile(viaExceljs, (v) => v))
		]);
	});

	it('не-Excel вместо справочника — понятная ошибка', async () => {
		const target = path.join(dir, 'broken.xlsx');
		await fs.writeFile(target, 'not a zip');
		await expect(readMappingFile(target, (v) => v)).rejects.toThrow(
			/не похож на Excel/
		);
	});

	describe('справочники из data/', () => {
		it('цвета: 890 строк поставщика, на которые опирается импорт', async () => {
			const colors = await loadColorMap();
			expect(colors.get('Avena')).toBe('Бежевый');
			// ключи нормализуются так же, как цвет из выгрузки: «000_бежевый»
			expect(colors.get(capitalizeFirstLetter('000_Бежевый'))).toBe('Бежевый');
			expect(colors.size).toBeGreaterThan(800);
			for (const target of colors.values()) {
				expect(target).toBe(capitalizeFirstLetter(target));
			}
		});

		it('размеры: числовые коды и буквенные — в верхнем регистре', async () => {
			const sizes = await loadSizeMap();
			expect(sizes.get('1')).toBe('40');
			expect(sizes.get('2')).toBe('42');
			expect(sizes.size).toBeGreaterThan(300);
			for (const [from, to] of sizes) {
				expect(from).toBe(from.toUpperCase());
				expect(to).toBe(to.toUpperCase());
			}
		});
	});
});

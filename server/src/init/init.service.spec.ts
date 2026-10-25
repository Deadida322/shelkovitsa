import * as path from 'path';
import { Repository } from 'typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { readSheet } from 'src/helpers/excelHelper';
import { capitalizeFirstLetter } from 'src/helpers/stringHelper';
import { loadColorMap, loadSizeMap } from 'src/product-article/supplier-format';
import { InitService } from './init.service';

// Второй столбец справочника — названия в каталоге
async function catalogColumn(file: string, normalize: (value: string) => string) {
	const rows = await readSheet(path.resolve('data', file));
	return new Set(
		rows
			.map((row) => String(row[1] ?? '').trim())
			.filter(Boolean)
			.map(normalize)
	);
}

// Репозиторий в памяти: InitService пользуется только find, save и update
function memoryRepository<T extends { id: number; name: string }>(
	initial: Omit<T, 'id'>[] = []
) {
	let nextId = 1;
	const rows: T[] = initial.map((row) => ({ ...row, id: nextId++ }) as T);
	const repository = {
		rows,
		find: vi.fn(async () => rows.map((row) => ({ ...row }))),
		save: vi.fn(async (row: Partial<T>) => {
			const saved = { ...row, id: nextId++ } as T;
			rows.push(saved);
			return saved;
		}),
		update: vi.fn(async (id: number, patch: Partial<T>) => {
			Object.assign(
				rows.find((row) => row.id === id)!,
				patch
			);
		})
	};
	return repository as typeof repository & Repository<T>;
}

describe('InitService — справочники из data/colors.xlsx и data/sizes.xlsx', () => {
	it('создаёт все цвета каталога (второй столбец) без дублей', async () => {
		const colors = memoryRepository<ProductColor>();
		const service = new InitService(colors, memoryRepository<ProductSize>());

		await service.initColors();

		const expected = await catalogColumn('colors.xlsx', capitalizeFirstLetter);
		expect(new Set(colors.rows.map((c) => c.name))).toEqual(expected);
		// всё, во что импорт переводит цвета поставщика, есть в каталоге
		for (const target of (await loadColorMap()).values())
			expect(expected).toContain(target);
		expect(colors.rows).toHaveLength(expected.size);
		expect(colors.rows.map((c) => c.name)).toContain('Бежевый');
	});

	it('повторный запуск ничего не добавляет; регистр существующего цвета выравнивается', async () => {
		const colors = memoryRepository<ProductColor>([
			{ name: 'БЕЖЕВЫЙ' } as ProductColor
		]);
		const service = new InitService(colors, memoryRepository<ProductSize>());

		await service.initColors();
		const count = colors.rows.length;
		expect(colors.rows.find((c) => c.id === 1)?.name).toBe('Бежевый');
		expect(colors.update).toHaveBeenCalledWith(1, { name: 'Бежевый' });

		colors.save.mockClear();
		colors.update.mockClear();
		await service.initColors();
		expect(colors.rows).toHaveLength(count);
		expect(colors.save).not.toHaveBeenCalled();
		expect(colors.update).not.toHaveBeenCalled();
	});

	it('создаёт недостающие размеры в верхнем регистре, существующие не трогает', async () => {
		const sizes = memoryRepository<ProductSize>([{ name: '40' } as ProductSize]);
		const service = new InitService(memoryRepository<ProductColor>(), sizes);

		await service.initSizes();

		const expected = await catalogColumn('sizes.xlsx', (v) => v.toUpperCase());
		expect(new Set(sizes.rows.map((s) => s.name))).toEqual(expected);
		for (const target of (await loadSizeMap()).values())
			expect(expected).toContain(target);
		expect(sizes.rows.filter((s) => s.name === '40')).toHaveLength(1);
		expect(sizes.save).not.toHaveBeenCalledWith({ name: '40' });
	});

	it('ошибка справочника при старте логируется и не роняет приложение', async () => {
		const colors = memoryRepository<ProductColor>();
		colors.find.mockRejectedValueOnce(new Error('БД недоступна'));
		const sizes = memoryRepository<ProductSize>();
		const service = new InitService(colors, sizes);
		const logger = vi
			.spyOn(
				(service as unknown as { logger: { error: () => void } }).logger,
				'error'
			)
			.mockImplementation(() => undefined);

		await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

		expect(logger).toHaveBeenCalledWith(
			'Не удалось загрузить справочник цветов',
			expect.stringContaining('БД недоступна')
		);
		expect(sizes.rows.length).toBeGreaterThan(0); // размеры всё равно загружены
	});
});

import { INestApplication } from '@nestjs/common';
import ExcelJS from 'exceljs';
import * as fs from 'fs/promises';
import * as http from 'http';
import * as path from 'path';
import { AddressInfo } from 'net';
import { ProductFile } from 'src/db/entities/ProductFile';
import { buildXlsx, readSheet } from 'src/helpers/excelHelper';
import { InitService } from 'src/init/init.service';
import { FILE_STORAGE, FileStorage } from 'src/storage/storage.types';
import { DataSource } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { CUSTOMER, createTestApp, registerAgent, resetDb, registerAdmin } from './utils';
import {
	cellRef,
	excelLikeXlsx,
	MAIN,
	rawXlsx,
	sheetXml,
	workbookRels,
	workbookXml
} from './xlsx';

// Строка выгрузки поставщика: значимы только колонки, которые читает импорт
function row(values: {
	article: string;
	category?: string;
	subcategory?: string;
	color?: string;
	size?: string | number;
	price?: number | string;
	amount?: number | string;
	name?: string;
	colorUrl?: string;
	imageUrls?: string[];
}) {
	const cells: unknown[] = new Array(19).fill(null);
	cells[1] = values.category ?? 'Женское нижнее белье';
	cells[2] = values.subcategory ?? 'Трусы';
	cells[3] = 'Janira';
	cells[4] = values.color ?? 'Avena'; // по data/colors.xlsx → «Бежевый»
	cells[5] = values.colorUrl ?? null;
	cells[6] = values.size ?? 1; // по data/sizes.xlsx → «40»
	cells[7] = values.price ?? 1000;
	cells[9] = 'Испания';
	cells[10] = 'Описание';
	cells[13] = values.article;
	cells[15] = values.imageUrls?.join(';') ?? null;
	cells[16] = values.name ?? `Товар ${values.article}`;
	cells[18] = values.amount ?? 3;
	return cells;
}

const binaryParser = (res, callback) => {
	const chunks: Buffer[] = [];
	res.on('data', (chunk: Buffer) => chunks.push(chunk));
	res.on('end', () => callback(null, Buffer.concat(chunks)));
};

describe('Импорт каталога из Excel (e2e)', () => {
	let app: INestApplication;
	let admin: Awaited<ReturnType<typeof registerAgent>>;

	const manager = () => app.get(DataSource).manager;
	const storage = () => app.get<FileStorage>(FILE_STORAGE);

	const upload = async (rows: unknown[][], isDeletedOther: string = 'false') =>
		admin
			.post('/api/admin/product-article/import')
			.field('isDeletedOther', isDeletedOther)
			.attach('file', await buildXlsx('Лист1', rows), 'import.xlsx')
			.buffer(true)
			.parse(binaryParser)
			.expect(200);

	const errorRows = (body: Buffer) => readSheet(body);

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
		admin = await registerAdmin(app);
		const category = await manager().save(ProductCategory, {
			name: 'Женское нижнее белье'
		});
		await manager().save(ProductSubcategory, {
			name: 'Трусы',
			productCategory: category
		});
		await manager().save(ProductColor, { name: 'Бежевый' });
	});

	afterAll(async () => {
		await app.close();
	});

	it('создаёт скрытый артикул и вариант с сопоставленными цветом и размером', async () => {
		const res = await upload([row({ article: 'A-1', amount: 3, price: 1500 })]);
		expect(await errorRows(res.body)).toHaveLength(0);

		const article = await manager().findOne(ProductArticle, {
			where: { article: 'A-1' }
		});
		expect(article.isVisible).toBe(false);
		expect(Number(article.price)).toBe(1500);

		const products = await manager().find(Product, {
			where: { productArticle: { id: article.id } }
		});
		expect(products).toHaveLength(1);
		expect(products[0].amount).toBe(3);
		expect(products[0].productColor.name).toBe('Бежевый');
		expect(products[0].productSize.name).toBe('40');
	});

	it('повторный импорт обновляет остаток, а не создаёт дубликат', async () => {
		await upload([row({ article: 'A-1', amount: 3 })]);
		await upload([row({ article: 'A-1', amount: 7 })]);

		const products = await manager().find(Product, {
			where: { productArticle: { article: 'A-1' } },
			withDeleted: true
		});
		expect(products).toHaveLength(1);
		expect(products[0].amount).toBe(7);
	});

	it('isDeletedOther=false (как шлёт фронт) не трогает остальной каталог', async () => {
		await upload([row({ article: 'A-1' })]);
		await upload([row({ article: 'B-2' })], 'false');

		const articles = await manager().find(ProductArticle);
		expect(articles.map((a) => a.article).sort()).toEqual(['A-1', 'B-2']);
	});

	it('isDeletedOther=true заменяет каталог содержимым файла', async () => {
		await upload([row({ article: 'A-1' }), row({ article: 'B-2' })]);
		await upload([row({ article: 'B-2' })], 'true');

		const articles = await manager().find(ProductArticle);
		expect(articles.map((a) => a.article)).toEqual(['B-2']);
	});

	it('строки с ошибками попадают в файл ошибок, остальные импортируются', async () => {
		const res = await upload([
			row({ article: 'OK-1' }),
			row({ article: 'BAD-1', subcategory: '' }),
			row({ article: 'BAD-2', color: 'Неизвестный цвет' }),
			row({ article: '', amount: 1 }),
			row({ article: 'BAD-3', size: 'XXXXL-нет-такого' })
		]);

		const errors = await errorRows(res.body);
		expect(errors).toHaveLength(4);
		const text = errors.map((r) => r.join(' ')).join('\n');
		expect(text).toMatch(/productSubcategory/);
		expect(text).toMatch(/цвета/);
		expect(text).toMatch(/article/);
		expect(text).toMatch(/размера/);

		expect(await manager().count(ProductArticle)).toBe(1);
	});

	it('создаёт недостающие категории и подкатегории; одинаковые имена — в своих категориях', async () => {
		await upload([
			row({
				article: 'W-1',
				category: 'Женское нижнее белье',
				subcategory: 'Трусы'
			}),
			row({ article: 'M-1', category: 'Мужское белье', subcategory: 'Трусы' }),
			row({ article: 'M-2', category: 'Мужское белье', subcategory: 'Майки' })
		]);

		const categories = await manager().find(ProductCategory, {
			relations: { productSubcategories: true },
			order: { id: 'ASC', productSubcategories: { id: 'ASC' } }
		});
		expect(
			categories.map((c) => [c.name, c.productSubcategories.map((s) => s.name)])
		).toEqual([
			['Женское нижнее белье', ['Трусы']],
			['Мужское белье', ['Трусы', 'Майки']]
		]);

		const m1 = await manager().findOne(ProductArticle, { where: { article: 'M-1' } });
		expect(m1.productSubcategory.productCategory.name).toBe('Мужское белье');
	});

	it('остаток «>5» из выгрузки поставщика читается как 5', async () => {
		const res = await upload([
			row({ article: 'A-1', amount: '>5' }),
			row({ article: 'A-2', amount: '> 12', size: 2 }),
			row({ article: 'A-3', amount: 'много' })
		]);

		expect(await errorRows(res.body)).toHaveLength(1);
		const amounts = (
			await manager().find(Product, { relations: { productArticle: true } })
		)
			.map((p) => [p.productArticle.article, p.amount])
			.sort();
		expect(amounts).toEqual([
			['A-1', 5],
			['A-2', 12]
		]);
	});

	it('строка заголовка выгрузки пропускается', async () => {
		const header = [
			'Код',
			'Категория',
			'Тип',
			'Торговая марка',
			'Цвет',
			'Фото цвета',
			'Размер',
			'Цена'
		];
		const res = await upload([header, row({ article: 'A-1' })]);
		expect(await errorRows(res.body)).toHaveLength(0);
		expect(await manager().count(ProductArticle)).toBe(1);
	});

	describe('картинки', () => {
		// 1x1 PNG
		const png = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
			'base64'
		);
		let server: http.Server;
		let base: string;
		let hits: Record<string, number>;

		beforeAll(async () => {
			server = http.createServer((req, res) => {
				hits[req.url] = (hits[req.url] ?? 0) + 1;
				if (req.url === '/redirect') {
					res.writeHead(302, { Location: '/b.png' }).end();
				} else if (req.url === '/page') {
					res.writeHead(200, { 'Content-Type': 'text/html' }).end(
						'<html></html>'
					);
				} else if (req.url.endsWith('.png') && req.url !== '/missing.png') {
					res.writeHead(200, { 'Content-Type': 'image/png' }).end(png);
				} else {
					res.writeHead(404).end();
				}
			});
			await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
			base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
		});

		beforeEach(() => {
			hits = {};
		});

		afterAll(async () => {
			await new Promise((resolve) => server.close(resolve));
		});

		it('скачивает фото товара и цвета, первое фото — логотип, битые ссылки пропускаются', async () => {
			const res = await upload([
				row({
					article: 'IMG-1',
					colorUrl: `${base}/color.png`,
					imageUrls: [
						`${base}/missing.png`,
						`${base}/page`,
						`${base}/a.png`,
						`${base}/redirect`
					]
				})
			]);
			expect(await errorRows(res.body)).toHaveLength(0);

			const article = await manager().findOne(ProductArticle, {
				where: { article: 'IMG-1' },
				relations: { productFiles: true }
			});
			const files = article.productFiles.sort((a, b) => a.id - b.id);
			expect(files.map((f) => f.url)).toEqual([
				`${base}/a.png`,
				`${base}/redirect`
			]);
			expect(files.map((f) => f.isLogo)).toEqual([true, false]);
			for (const file of files) {
				expect(await storage().exists(file.name)).toBe(true);
			}

			const color = await manager().findOne(ProductColor, {
				where: { name: 'Бежевый' }
			});
			expect(color.url).toBe(`${base}/color.png`);
			expect(await storage().exists(color.image)).toBe(true);
		});

		it('повторный импорт не скачивает уже загруженные фото', async () => {
			const imported = row({ article: 'IMG-1', imageUrls: [`${base}/a.png`] });
			await upload([imported]);
			await upload([imported]);

			expect(hits['/a.png']).toBe(1);
			expect(await manager().count(ProductFile)).toBe(1);
		});
	});

	it('не-Excel файл отклоняется', async () => {
		await admin
			.post('/api/admin/product-article/import')
			.attach('file', Buffer.from('just text'), 'import.xlsx')
			.expect((res) => expect([400, 422]).toContain(res.status));
	});

	it('старый .xls отклоняется с подсказкой пересохранить в .xlsx', async () => {
		const ole = Buffer.concat([
			Buffer.from('d0cf11e0a1b11ae1', 'hex'),
			Buffer.alloc(504)
		]);
		const res = await admin
			.post('/api/admin/product-article/import')
			.attach('file', ole, 'import.xls')
			.expect(400);
		expect(res.body.error.message).toMatch(/пересохраните/);
	});

	it('битый xlsx — 400, каталог при isDeletedOther=true не очищается', async () => {
		await upload([row({ article: 'A-1' })]);
		const valid = await buildXlsx('Лист1', [row({ article: 'B-2' })]);
		await admin
			.post('/api/admin/product-article/import')
			.field('isDeletedOther', 'true')
			.attach('file', valid.subarray(0, valid.length - 30), 'import.xlsx')
			.expect(400);
		expect(await manager().count(ProductArticle)).toBe(1);
	});

	it('загружать каталог может только админ', async () => {
		const customer = await registerAgent(app, CUSTOMER);
		await customer
			.post('/api/admin/product-article/import')
			.attach(
				'file',
				await buildXlsx('Лист1', [row({ article: 'A-1' })]),
				'import.xlsx'
			)
			.expect(403);
	});

	describe('форматы файла', () => {
		// файл как есть, без проверки статуса
		const send = (file: Buffer, name = 'import.xlsx', isDeletedOther = 'false') =>
			admin
				.post('/api/admin/product-article/import')
				.field('isDeletedOther', isDeletedOther)
				.attach('file', file, name)
				.buffer(true)
				.parse(binaryParser);

		const message = (res: { body: Buffer }) =>
			JSON.parse(res.body.toString()).error.message as string;

		it('файл, сохранённый Excel (листы раньше sharedStrings, workbook.xml в конце)', async () => {
			const res = await send(
				await excelLikeXlsx([
					SUPPLIER_HEADER,
					row({ article: 'XL-1', amount: '>5' }),
					row({ article: 'XL-2', size: 2, price: '1014.3' })
				])
			).expect(200);
			expect(await errorRows(res.body)).toEqual([]);

			const products = await manager().find(Product, {
				relations: { productArticle: true }
			});
			expect(
				products
					.map((p) => [p.productArticle.article, p.amount, p.productSize.name])
					.sort()
			).toEqual([
				['XL-1', 5, '40'],
				['XL-2', 3, '42']
			]);
			const xl2 = await manager().findOneBy(ProductArticle, { article: 'XL-2' });
			expect(Number(xl2.price)).toBe(1014.3);
		});

		it('импортируется только первый лист книги', async () => {
			const sheet = (article: string) =>
				sheetXml(
					`<row r="1">${row({ article })
						.map((value, c) =>
							value === null
								? ''
								: typeof value === 'number'
									? `<c r="${cellRef(c, 1)}"><v>${value}</v></c>`
									: `<c r="${cellRef(c, 1)}" t="inlineStr"><is><t>${value}</t></is></c>`
						)
						.join('')}</row>`
				);
			const file = await rawXlsx([
				[
					'xl/workbook.xml',
					workbookXml([
						{ name: 'Первый', id: 'rId2' },
						{ name: 'Второй', id: 'rId1' }
					])
				],
				[
					'xl/_rels/workbook.xml.rels',
					workbookRels(
						[
							{ id: 'rId1', target: 'worksheets/sheet1.xml' },
							{ id: 'rId2', target: 'worksheets/sheet2.xml' }
						],
						null
					)
				],
				['xl/worksheets/sheet1.xml', sheet('SECOND')],
				['xl/worksheets/sheet2.xml', sheet('FIRST')]
			]);
			await send(file).expect(200);
			const articles = await manager().find(ProductArticle);
			expect(articles.map((a) => a.article)).toEqual(['FIRST']);
		});

		it('файл ошибок: номера строк как в Excel, исходные значения сохранены, «=» остаётся текстом', async () => {
			const formula = '=HYPERLINK("http://evil","клик")';
			const res = await send(
				await excelLikeXlsx([
					SUPPLIER_HEADER,
					row({ article: 'OK-1' }),
					[],
					[],
					row({ article: 'BAD-1', subcategory: '', name: formula }),
					row({ article: 'BAD-2', color: 'Неизвестный' })
				])
			).expect(200);

			const errors = await errorRows(res.body);
			expect(errors).toHaveLength(2);
			expect(errors[0].slice(0, 19)).toEqual(
				row({ article: 'BAD-1', subcategory: '', name: formula }).map((v) =>
					v === null || v === '' ? undefined : v
				)
			);
			expect(errors[0].join(' ')).toMatch(
				/В строке 5 отсутствуют обязательные поля: productSubcategory/
			);
			expect(errors[1].join(' ')).toMatch(/Строка 6: .*цвета/);

			const book = new ExcelJS.Workbook();
			await book.xlsx.load(res.body as unknown as ArrayBuffer);
			expect(book.worksheets[0].name).toBe('Ошибки');
			const cell = book.worksheets[0].getCell('Q1'); // «Наименование на сайте»
			expect(cell.value).toBe(formula);
			expect(cell.type).toBe(ExcelJS.ValueType.String);
		});

		it('без ошибок — пустой лист «Ошибок нет»', async () => {
			const res = await send(await excelLikeXlsx([row({ article: 'A-1' })])).expect(
				200
			);
			const book = new ExcelJS.Workbook();
			await book.xlsx.load(res.body as unknown as ArrayBuffer);
			expect(book.worksheets.map((s) => s.name)).toEqual(['Ошибок нет']);
			expect(await errorRows(res.body)).toEqual([]);
		});

		it('заголовок после пустых строк тоже пропускается', async () => {
			const res = await send(
				await excelLikeXlsx([[], [], SUPPLIER_HEADER, row({ article: 'A-1' })])
			).expect(200);
			expect(await errorRows(res.body)).toEqual([]);
			expect(await manager().count(ProductArticle)).toBe(1);
		});

		it('строки реальной выгрузки поставщика (без ссылок на фото)', async () => {
			// справочники каталога, как при старте приложения (resetDb их очищает)
			await app.get(InitService).initColors();
			await app.get(InitService).initSizes();
			const real = await readSheet(
				path.resolve('..', 'temp-dev', 'shel_data_new.xlsx')
			);
			const [header, ...body] = real;
			// первые 40 строк + детский размер «3/4», который Excel сохранил датой
			const sample = [
				...body.slice(0, 40),
				body.find((r) => r[0] === '339дбПиждо-4гм')!
			].map((r) => r.map((v, c) => (c === 5 || c === 15 ? undefined : v)));

			const res = await send(await excelLikeXlsx([header, ...sample])).expect(200);
			const errors = await errorRows(res.body);
			const errorText = errors.map((r) => r.join(' ')).join('\n');

			// «3/4» нет в sizes.xlsx — строка уходит в ошибки с понятной причиной
			expect(errorText).toMatch(/339дбПиждо-4гм.*размера/);

			expect(errors).toHaveLength(1);
			// у 1030217Ут цвета поставщика Dune и Nilo оба → «Бежевый» по colors.xlsx:
			// 3 пары строк (M, L, XL) склеиваются в один вариант каталога
			expect(await manager().count(Product)).toBe(
				sample.length - errors.length - 3
			);

			const first = await manager().findOne(ProductArticle, {
				where: { article: '1025612Брк' },
				relations: { products: true }
			});
			expect(first.name).toBe('1025612 Брюки пижамные Airy');
			expect(first.composition).toBe('56% VI+ 32% PA + 12% EA');
			expect(Number(first.price)).toBe(3579.03);
			expect(first.productSubcategory.name).toBe('Брюки');
			expect(first.productSubcategory.productCategory.name).toBe(
				'Верхний трикотаж'
			);
		});

		// ТЕКУЩЕЕ поведение, зафиксировано тестом намеренно: если два цвета поставщика
		// сопоставлены одному цвету каталога, вариант один и остаток берётся из последней
		// строки (не суммируется). В выгрузке так склеивается 2 609 строк в 1 230 вариантов.
		it('два цвета поставщика → один цвет каталога: один вариант, остаток последней строки', async () => {
			const res = await send(
				await excelLikeXlsx([
					row({ article: 'MERGE-1', color: 'Dune', amount: '>5' }),
					row({ article: 'MERGE-1', color: 'Nilo', amount: 2 })
				])
			).expect(200);
			expect(await errorRows(res.body)).toEqual([]);
			const products = await manager().find(Product, {
				relations: { productArticle: true }
			});
			expect(products.map((p) => [p.productColor.name, p.amount])).toEqual([
				['Бежевый', 2]
			]);
		});

		describe('отклоняется без изменений каталога (isDeletedOther=true)', () => {
			beforeEach(async () => {
				await upload([row({ article: 'KEEP-1' }), row({ article: 'KEEP-2' })]);
			});

			afterEach(async () => {
				const articles = await manager().find(ProductArticle);
				expect(articles.map((a) => a.article).sort()).toEqual([
					'KEEP-1',
					'KEEP-2'
				]);
			});

			it('битый XML после нескольких корректных строк', async () => {
				const good = row({ article: 'NEW-1' })
					.map((value, c) =>
						value === null
							? ''
							: typeof value === 'number'
								? `<c r="${cellRef(c, 1)}"><v>${value}</v></c>`
								: `<c r="${cellRef(c, 1)}" t="inlineStr"><is><t>${value}</t></is></c>`
					)
					.join('');
				const file = await rawXlsx([
					[
						'xl/worksheets/sheet1.xml',
						sheetXml(
							`<row r="1">${good}</row><row r="2">${good}</row><row r="3"><c r="A3"><v>1</v>`
						)
					]
				]);
				const res = await send(file, 'import.xlsx', 'true').expect(400);
				expect(message(res)).toMatch(/Не удалось прочитать Excel/);
			});

			it('zip-бомба', async () => {
				const file = await rawXlsx([
					[
						'xl/worksheets/sheet1.xml',
						`${sheetXml('<row r="1"><c r="A1"><v>1</v></c></row>')}<!--${' '.repeat(30 * 1024 * 1024)}-->`
					]
				]);
				const res = await send(file, 'import.xlsx', 'true').expect(400);
				expect(message(res)).toMatch(/zip-бомба/);
			});

			it('XXE / billion laughs', async () => {
				const file = await rawXlsx([
					[
						'xl/worksheets/sheet1.xml',
						`<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><worksheet xmlns="${MAIN}"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>&xxe;</t></is></c></row></sheetData></worksheet>`
					]
				]);
				const res = await send(file, 'import.xlsx', 'true').expect(400);
				expect(message(res)).toMatch(/undefined entity/);
			});

			it('книга без данных', async () => {
				const res = await send(
					await excelLikeXlsx([]),
					'import.xlsx',
					'true'
				).expect(400);
				expect(message(res)).toMatch(/нет данных/);
			});

			it('пустой файл (0 байт)', async () => {
				const res = await send(Buffer.alloc(0), 'import.xlsx', 'true');
				expect([400, 422]).toContain(res.status);
			});

			it('Excel-содержимое под чужим расширением и типом', async () => {
				const res = await admin
					.post('/api/admin/product-article/import')
					.field('isDeletedOther', 'true')
					.attach('file', await buildXlsx('Лист1', [row({ article: 'X' })]), {
						filename: 'import.csv',
						contentType: 'text/csv'
					})
					.expect(400);
				expect(res.body.error.message).toMatch(/Неверный тип файла/);
			});
		});

		describe('загрузка', () => {
			const tempDir = path.resolve(process.env.TEMP_PATH!);
			const tempFiles = async () =>
				(await fs.readdir(tempDir).catch(() => [] as string[])).filter(
					(f) => !f.startsWith('.')
				);

			let before: string[];

			beforeEach(async () => {
				before = await tempFiles();
			});

			afterEach(async () => {
				// загруженный файл живёт только на время импорта — и при успехе, и при ошибке
				expect(await tempFiles()).toEqual(before);
			});

			it('имя файла от клиента не используется (../ в имени не выводит из папки)', async () => {
				const escape = path.resolve(tempDir, '..', '..', 'evil.xlsx');
				await send(
					await buildXlsx('Лист1', [row({ article: 'A-1' })]),
					'../../evil.xlsx'
				).expect(200);
				await expect(fs.stat(escape)).rejects.toThrow();
				expect(await manager().count(ProductArticle)).toBe(1);
			});

			it('успешный и неуспешный импорт не оставляют временных файлов', async () => {
				await send(await buildXlsx('Лист1', [row({ article: 'A-1' })])).expect(
					200
				);
				await send(Buffer.from('not excel')).expect(400);
			});

			it('файл больше UPLOAD_MAX_FILE_SIZE_MB обрывается на загрузке — 413', async () => {
				const previous = process.env.UPLOAD_MAX_FILE_SIZE_MB;
				process.env.UPLOAD_MAX_FILE_SIZE_MB = '0.01'; // ~10 КБ, читается на каждый запрос
				try {
					const big = await buildXlsx(
						'Лист1',
						Array.from({ length: 2000 }, (_, i) =>
							row({ article: `BIG-${i}` })
						)
					);
					expect(big.length).toBeGreaterThan(10 * 1024);
					const res = await send(big).expect(413);
					expect(message(res)).toMatch(/too large/i);
					// небольшой файл под тем же лимитом проходит
					await send(
						await buildXlsx('Лист1', [row({ article: 'SMALL' })])
					).expect(200);
				} finally {
					process.env.UPLOAD_MAX_FILE_SIZE_MB = previous;
				}
				expect(await manager().count(ProductArticle)).toBe(1);
			});

			it('без файла — 422', async () => {
				await admin
					.post('/api/admin/product-article/import')
					.field('isDeletedOther', 'false')
					.expect(422);
			});

			it('два файла в одном запросе отклоняются', async () => {
				const file = await buildXlsx('Лист1', [row({ article: 'A-1' })]);
				const res = await admin
					.post('/api/admin/product-article/import')
					.attach('file', file, 'a.xlsx')
					.attach('file', file, 'b.xlsx');
				expect([400, 413]).toContain(res.status);
				expect(await manager().count(ProductArticle)).toBe(0);
			});
		});
	});
});

const SUPPLIER_HEADER = [
	'Код',
	'Категория',
	'Тип',
	'Торговая марка',
	'Цвет',
	'Фото цвета',
	'Размер',
	'Цена',
	'Штрих-код',
	'Страна',
	'Описание',
	'Состав',
	'Производитель',
	'Артикул на сайте',
	'Полное наименование',
	'Фото (через ;)',
	'Наименование на сайте',
	'Распродажа',
	'Остаток'
];

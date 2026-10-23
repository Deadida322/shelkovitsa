import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as xlsx from 'node-xlsx';
import { ProductFile } from 'src/db/entities/ProductFile';
import { getDestPath } from 'src/helpers/storageHelper';
import { DataSource } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { CUSTOMER, createTestApp, registerAgent, resetDb, registerAdmin } from './utils';

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

function buildXlsx(rows: unknown[][]): Buffer {
	return xlsx.build([{ name: 'Лист1', data: rows, options: {} }]);
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

	const upload = (rows: unknown[][], isDeletedOther: string = 'false') =>
		admin
			.put('/api/product-article/uploadProducts')
			.field('isDeletedOther', isDeletedOther)
			.attach('file', buildXlsx(rows), 'import.xlsx')
			.buffer(true)
			.parse(binaryParser);

	const errorRows = (body: Buffer) => xlsx.parse(body)[0].data as unknown[][];

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
		const res = await upload([
			row({ article: 'A-1', amount: 3, price: 1500 })
		]).expect(200);
		expect(errorRows(res.body)).toHaveLength(0);

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
		await upload([row({ article: 'A-1', amount: 3 })]).expect(200);
		await upload([row({ article: 'A-1', amount: 7 })]).expect(200);

		const products = await manager().find(Product, {
			where: { productArticle: { article: 'A-1' } },
			withDeleted: true
		});
		expect(products).toHaveLength(1);
		expect(products[0].amount).toBe(7);
	});

	it('isDeletedOther=false (как шлёт фронт) не трогает остальной каталог', async () => {
		await upload([row({ article: 'A-1' })]).expect(200);
		await upload([row({ article: 'B-2' })], 'false').expect(200);

		const articles = await manager().find(ProductArticle);
		expect(articles.map((a) => a.article).sort()).toEqual(['A-1', 'B-2']);
	});

	it('isDeletedOther=true заменяет каталог содержимым файла', async () => {
		await upload([row({ article: 'A-1' }), row({ article: 'B-2' })]).expect(200);
		await upload([row({ article: 'B-2' })], 'true').expect(200);

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
		]).expect(200);

		const errors = errorRows(res.body);
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
		]).expect(200);

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
		]).expect(200);

		expect(errorRows(res.body)).toHaveLength(1);
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
		const res = await upload([header, row({ article: 'A-1' })]).expect(200);
		expect(errorRows(res.body)).toHaveLength(0);
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
			]).expect(200);
			expect(errorRows(res.body)).toHaveLength(0);

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
				expect(fs.existsSync(getDestPath(file.name))).toBe(true);
			}

			const color = await manager().findOne(ProductColor, {
				where: { name: 'Бежевый' }
			});
			expect(color.url).toBe(`${base}/color.png`);
			expect(fs.existsSync(getDestPath(color.image))).toBe(true);
		});

		it('повторный импорт не скачивает уже загруженные фото', async () => {
			const imported = row({ article: 'IMG-1', imageUrls: [`${base}/a.png`] });
			await upload([imported]).expect(200);
			await upload([imported]).expect(200);

			expect(hits['/a.png']).toBe(1);
			expect(await manager().count(ProductFile)).toBe(1);
		});
	});

	it('не-Excel файл отклоняется', async () => {
		await admin
			.put('/api/product-article/uploadProducts')
			.attach('file', Buffer.from('just text'), 'import.xlsx')
			.expect((res) => expect([400, 422]).toContain(res.status));
	});

	it('загружать каталог может только админ', async () => {
		const customer = await registerAgent(app, CUSTOMER);
		await customer
			.put('/api/product-article/uploadProducts')
			.attach('file', buildXlsx([row({ article: 'A-1' })]), 'import.xlsx')
			.expect(403);
	});
});

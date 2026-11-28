import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import {
	CUSTOMER,
	createTestApp,
	registerAdmin,
	registerAgent,
	resetDb,
	seedCatalog
} from './utils';

describe('Catalog (e2e)', () => {
	let app: INestApplication;
	const listBody = { page: 0, itemsPerPage: 10 };

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
	});

	afterAll(async () => {
		await app.close();
	});

	it('публичный список отдаёт только видимые артикулы', async () => {
		const catalog = await seedCatalog(app);

		let res = await request(app.getHttpServer())
			.get('/api/product-article')
			.query(listBody)
			.expect(200);
		expect(res.body.count).toBe(1);

		await app
			.get(DataSource)
			.query(`UPDATE product_article SET "isVisible" = false WHERE id = $1`, [
				catalog.article.id
			]);

		res = await request(app.getHttpServer())
			.get('/api/product-article')
			.query(listBody)
			.expect(200);
		expect(res.body.count).toBe(0);
	});

	it('админский список видит и скрытые артикулы', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app);
		await app
			.get(DataSource)
			.query(`UPDATE product_article SET "isVisible" = false WHERE id = $1`, [
				catalog.article.id
			]);

		const res = await admin
			.get('/api/admin/product-article')
			.query(listBody)
			.expect(200);
		expect(res.body.count).toBe(1);
	});

	it('детальная карточка видимого артикула', async () => {
		const catalog = await seedCatalog(app);
		const res = await request(app.getHttpServer())
			.get(`/api/product-article/${catalog.article.id}`)
			.query({})
			.expect(200);
		expect(res.body.article).toBe('ART-001');
		expect(res.body.available).toBe(5);
	});

	it('карточка: в селектах только размеры и цвета с остатком', async () => {
		const catalog = await seedCatalog(app);
		const manager = app.get(DataSource).manager;
		const sizeInStock = await manager.save(ProductSize, { name: '50' });
		const sizeOos = await manager.save(ProductSize, { name: '52' });
		const colorInStock = await manager.save(ProductColor, { name: 'Белый' });
		const colorOos = await manager.save(ProductColor, { name: 'Принт' });
		await manager.save(Product, {
			amount: 3,
			productArticle: catalog.article,
			productColor: colorInStock,
			productSize: sizeInStock
		});
		await manager.save(Product, {
			amount: 0,
			productArticle: catalog.article,
			productColor: colorOos,
			productSize: sizeInStock
		});
		await manager.save(Product, {
			amount: 0,
			productArticle: catalog.article,
			productColor: colorInStock,
			productSize: sizeOos
		});

		const card = await request(app.getHttpServer())
			.get(`/api/product-article/${catalog.article.id}`)
			.query({})
			.expect(200);
		expect(card.body.productSizes.map((s: { name: string }) => s.name).sort()).toEqual([
			'50',
			'75B'
		]);
		expect(card.body.productColors.map((c: { name: string }) => c.name)).not.toContain(
			'Принт'
		);

		const bySize = await request(app.getHttpServer())
			.get(`/api/product-article/${catalog.article.id}`)
			.query({ productSizeId: sizeInStock.id })
			.expect(200);
		expect(bySize.body.productColors.map((c: { name: string }) => c.name)).toEqual([
			'Белый'
		]);
		expect(bySize.body.productColors.map((c: { name: string }) => c.name)).not.toContain(
			'Принт'
		);
	});

	it('скрытый и закончившийся артикул: 404 и available=0', async () => {
		const catalog = await seedCatalog(app, { amount: 0 });
		const inStock = await request(app.getHttpServer())
			.get(`/api/product-article/${catalog.article.id}`)
			.expect(200);
		expect(inStock.body.available).toBe(0);

		await app
			.get(DataSource)
			.manager.update(ProductArticle, catalog.article.id, { isVisible: false });
		await request(app.getHttpServer())
			.get(`/api/product-article/${catalog.article.id}`)
			.expect(404);
	});

	it('категории доступны без авторизации', async () => {
		await seedCatalog(app);
		const res = await request(app.getHttpServer())
			.get('/api/product-category')
			.expect(200);
		expect(res.body).toHaveLength(1);
	});

	it('справочники цветов, размеров и доставки', async () => {
		await seedCatalog(app);
		await request(app.getHttpServer()).get('/api/product-color').expect(200);
		await request(app.getHttpServer()).get('/api/product-size').expect(200);
		const res = await request(app.getHttpServer())
			.get('/api/delivery-type')
			.expect(200);
		expect(res.body).toHaveLength(1);
	});

	it('query-параметры валидируются и приводятся к числам', async () => {
		await seedCatalog(app);
		const ok = await request(app.getHttpServer())
			.get('/api/product-article')
			.query({ page: '0', itemsPerPage: '5', minPrice: '100000' })
			.expect(200);
		expect(ok.body.count).toBe(1);

		await request(app.getHttpServer())
			.get('/api/product-article')
			.query({ page: 0, itemsPerPage: 500 })
			.expect(422);
		await request(app.getHttpServer()).get('/api/product-article/abc').expect(400);
	});

	describe('фильтры каталога и админского списка', () => {
		// В базе: ART-001 (Milavitsa, 1500, размер 75B ×5) из seedCatalog, плюс
		//  ART-002 (Janira, 800, 75B ×0 и 80C ×2, без фото, скрыт)
		//  ART-003 (Janira, 3000, 80C ×4, опубликован)
		//  ART-004 (без бренда, 100, нет вариантов, в архиве)
		let catalog: Awaited<ReturnType<typeof seedCatalog>>;
		let size80C: ProductSize;
		let admin: Awaited<ReturnType<typeof registerAdmin>>;

		const manager = () => app.get(DataSource).manager;
		const publicList = async (query: Record<string, unknown>) =>
			(
				await request(app.getHttpServer())
					.get('/api/product-article')
					.query({ page: 0, itemsPerPage: 10, ...query })
					.expect(200)
			).body;
		const adminList = async (query: Record<string, unknown>) =>
			(
				await admin
					.get('/api/admin/product-article')
					.query({ page: 0, itemsPerPage: 10, ...query })
					.expect(200)
			).body;
		const articles = (body: { data: { article: string }[] }) =>
			body.data.map((a) => a.article);

		async function addArticle(
			article: string,
			options: {
				brand?: string;
				price: number;
				isVisible: boolean;
				withImage?: boolean;
				archived?: boolean;
				variants?: [ProductSize, number][];
			}
		) {
			const saved = await manager().save(ProductArticle, {
				article,
				name: `Товар ${article}`,
				brand: options.brand,
				price: options.price,
				isVisible: options.isVisible,
				productSubcategory: catalog.article.productSubcategory
			});
			for (const [size, amount] of options.variants ?? []) {
				await manager().save(Product, {
					amount,
					productArticle: saved,
					productColor: catalog.color,
					productSize: size
				});
			}
			if (options.withImage) {
				await manager().save(ProductFile, {
					name: `${article}.png`,
					isLogo: true,
					productArticle: saved
				});
			}
			if (options.archived) await manager().softDelete(ProductArticle, saved.id);
			return saved;
		}

		beforeEach(async () => {
			catalog = await seedCatalog(app);
			admin = await registerAdmin(app);
			await manager().update(ProductArticle, catalog.article.id, {
				brand: 'Milavitsa'
			});
			size80C = await manager().save(ProductSize, { name: '80C' });
			await addArticle('ART-002', {
				brand: 'Janira',
				price: 80000,
				isVisible: false,
				variants: [
					[catalog.size, 0],
					[size80C, 2]
				]
			});
			await addArticle('ART-003', {
				brand: 'Janira',
				price: 300000,
				isVisible: true,
				withImage: true,
				variants: [[size80C, 4]]
			});
			await addArticle('ART-004', {
				price: 10000,
				isVisible: true,
				archived: true
			});
		});

		it('бренд: несколько значений, без учёта регистра', async () => {
			expect(articles(await publicList({ brand: 'milavitsa' }))).toEqual([
				'ART-001'
			]);
			expect(
				articles(await publicList({ brand: ['milavitsa', 'JANIRA'] }))
			).toEqual(['ART-001', 'ART-003']);
			expect((await publicList({ brand: 'UnknownBrand' })).count).toBe(0);
		});

		it('размер: нужен вариант этого размера в наличии; несколько размеров — «или»', async () => {
			const bySize = await publicList({ productSizeId: catalog.size.id });
			expect(articles(bySize)).toEqual(['ART-001']);
			// ART-002 скрыт, а у ART-003 нет 75B
			expect(articles(await publicList({ productSizeId: size80C.id }))).toEqual([
				'ART-003'
			]);
			expect(
				articles(
					await publicList({ productSizeId: [catalog.size.id, size80C.id] })
				)
			).toEqual(['ART-001', 'ART-003']);

			// размер без остатка не считается
			await manager().update(Product, { id: catalog.product.id }, { amount: 0 });
			expect((await publicList({ productSizeId: catalog.size.id })).count).toBe(0);
		});

		it('поиск: exact/prefix артикула и подстрока в названии', async () => {
			expect(articles(await publicList({ query: 'ART-001' }))).toEqual(['ART-001']);
			expect(articles(await publicList({ query: 'ART-00' }))).toContain('ART-001');
			await manager().update(
				ProductArticle,
				{ article: 'ART-001' },
				{ name: 'Бюстгальтер кружевной Crystal' }
			);
			expect(articles(await publicList({ query: 'кружев' }))).toEqual(['ART-001']);
		});

		it('в наличии по умолчанию, цена, сортировка и поиск по бренду', async () => {
			await manager().update(Product, { id: catalog.product.id }, { amount: 0 });
			expect(articles(await publicList({ inStock: 'true' }))).toEqual(['ART-003']);
			// публичный каталог всегда только в наличии — query не отключает
			expect((await publicList({ inStock: 'false' })).count).toBe(1);

			const all = await publicList({ sort: 'priceDesc' });
			expect(articles(all)).toEqual(['ART-003']);
			expect(articles(await publicList({ sort: 'priceAsc' }))).toEqual(['ART-003']);
			expect(articles(await publicList({ sort: 'new' }))).toEqual(['ART-003']);
			// default = по популярности; без заказов порядок стабильный по id
			expect(articles(await publicList({ sort: 'default' }))).toEqual(['ART-003']);
			expect(articles(await publicList({}))).toEqual(['ART-003']);

			expect(articles(await publicList({ minPrice: 200000 }))).toEqual(['ART-003']);
			// поиск находит и по бренду, и сочетается с фильтром бренда
			expect(articles(await publicList({ query: 'janira' }))).toEqual(['ART-003']);
			expect(
				articles(await publicList({ query: 'janira', brand: 'Milavitsa' }))
			).toEqual([]);
			expect((await publicList({ query: '100%' })).count).toBe(0);
		});

		it('неизвестная сортировка и мусор в фильтрах — 422', async () => {
			for (const query of [
				{ sort: 'random' },
				{ productSizeId: 'abc' },
				{ productSizeId: '-1' }
			]) {
				await request(app.getHttpServer())
					.get('/api/product-article')
					.query({ page: 0, itemsPerPage: 10, ...query })
					.expect(422);
			}
		});

		it('админские параметры в публичном каталоге игнорируются', async () => {
			const body = await publicList({
				status: 'archive',
				image: 'without',
				stock: 'without'
			});
			expect(articles(body)).toEqual(['ART-001', 'ART-003']);
		});

		it('админка: статус публикации, архив, фото и остаток', async () => {
			expect(articles(await adminList({}))).toEqual([
				'ART-001',
				'ART-002',
				'ART-003',
				'ART-004'
			]);
			expect(articles(await adminList({ status: 'published' }))).toEqual([
				'ART-001',
				'ART-003'
			]);
			expect(articles(await adminList({ status: 'hidden' }))).toEqual(['ART-002']);
			expect(articles(await adminList({ status: 'active' }))).toEqual([
				'ART-001',
				'ART-002',
				'ART-003'
			]);
			expect(articles(await adminList({ status: 'archive' }))).toEqual(['ART-004']);

			expect(articles(await adminList({ image: 'without' }))).toEqual([
				'ART-002',
				'ART-004'
			]);
			expect(articles(await adminList({ image: 'with' }))).toEqual([
				'ART-001',
				'ART-003'
			]);
			// у ART-002 есть остаток 2 в 80C; у ART-004 вариантов нет вовсе
			expect(articles(await adminList({ stock: 'without' }))).toEqual(['ART-004']);
			expect(articles(await adminList({ stock: 'with' }))).toEqual([
				'ART-001',
				'ART-002',
				'ART-003'
			]);
			expect(
				articles(
					await adminList({ status: 'hidden', brand: 'janira', query: '002' })
				)
			).toEqual(['ART-002']);
		});

		it('админка: суммарный остаток по живым вариантам', async () => {
			const body = await adminList({});
			const amounts = Object.fromEntries(
				body.data.map((a: { article: string; totalAmount: number }) => [
					a.article,
					a.totalAmount
				])
			);
			expect(amounts).toEqual({
				'ART-001': 5,
				'ART-002': 2,
				'ART-003': 4,
				'ART-004': 0
			});
			// в публичном ответе остатков нет
			expect((await publicList({})).data[0]).not.toHaveProperty('totalAmount');
		});

		it('значения фильтров: бренды, размеры в наличии, диапазон цен', async () => {
			const res = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.expect(200);
			expect(res.body.brands).toEqual([
				{ name: 'Janira', count: 1 },
				{ name: 'Milavitsa', count: 1 }
			]);
			// 80C только у опубликованного ART-003 (ART-002 скрыт); 75B — у ART-001
			expect(res.body.sizes).toEqual([
				{ id: catalog.size.id, name: '75B', count: 1 },
				{ id: size80C.id, name: '80C', count: 1 }
			]);
			expect(res.body.price).toEqual({ min: 150000, max: 300000 });

			const narrowed = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.query({ query: 'milavitsa' })
				.expect(200);
			expect(narrowed.body.brands).toEqual([{ name: 'Milavitsa', count: 1 }]);
			expect(narrowed.body.price).toEqual({ min: 150000, max: 150000 });

			const adminRes = await admin
				.get('/api/admin/product-article/filters')
				.expect(200);
			expect(adminRes.body.brands.map((b: { name: string }) => b.name)).toEqual([
				'Janira',
				'Milavitsa'
			]);
			expect(adminRes.body.brands[0].count).toBe(2);
			await request(app.getHttpServer())
				.get('/api/admin/product-article/filters')
				.expect(401);
		});

		it('счётчики фасетов учитывают пересечение бренда и размера', async () => {
			// бренд сужает размеры: у Milavitsa только 75B, у Janira (публично) — только 80C
			const byMilavitsa = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.query({ brand: 'Milavitsa' })
				.expect(200);
			expect(byMilavitsa.body.sizes).toEqual([
				{ id: catalog.size.id, name: '75B', count: 1 }
			]);
			expect(byMilavitsa.body.price).toEqual({ min: 150000, max: 150000 });
			// список брендов не «запирается» выбранным брендом
			expect(byMilavitsa.body.brands.map((b: { name: string }) => b.name)).toEqual([
				'Janira',
				'Milavitsa'
			]);

			const bySize = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.query({ productSizeId: size80C.id })
				.expect(200);
			expect(bySize.body.brands).toEqual([{ name: 'Janira', count: 1 }]);
			// размеры считаются без учёта выбранного размера
			expect(bySize.body.sizes).toEqual([
				{ id: catalog.size.id, name: '75B', count: 1 },
				{ id: size80C.id, name: '80C', count: 1 }
			]);
		});

		it('значения фильтров ограничиваются категорией', async () => {
			const other = await manager().save(ProductCategory, { name: 'Купальники' });
			const sub = await manager().save(ProductSubcategory, {
				name: 'Слитные',
				productCategory: other
			});
			await manager().update(
				ProductArticle,
				{ article: 'ART-003' },
				{
					productSubcategory: sub
				}
			);

			const res = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.query({ categoryId: other.id })
				.expect(200);
			expect(res.body.brands).toEqual([{ name: 'Janira', count: 1 }]);
			expect(res.body.price).toEqual({ min: 300000, max: 300000 });

			const none = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.query({
					subcategoryId: sub.id,
					categoryId: catalog.article.productSubcategory.productCategory.id
				})
				.expect(200);
			expect(none.body).toEqual({
				brands: [],
				sizes: [],
				price: { min: 0, max: 0 }
			});
		});

		it('minPrice=0 не игнорируется', async () => {
			expect(articles(await publicList({ minPrice: 0, maxPrice: 160000 }))).toEqual(
				['ART-001']
			);
			expect(articles(await publicList({ maxPrice: 0 }))).toEqual([]);
		});
	});

	/**
	 * Матрица фасетов (публичный каталог).
	 *
	 * Фикстура:
	 *  A1 Milavitsa  1000  75B×3          — в наличии
	 *  A2 Milavitsa  2000  80C×2          — в наличии
	 *  A3 Janira     1500  75B×1, 80C×0   — 75B в наличии, 80C нет
	 *  A4 Janira     2500  80C×5          — в наличии
	 *  A5 Sielei     1800  75B×0          — опубликован, но нет остатка ни по одному размеру
	 *
	 * Контракт UI:
	 *  - список = AND между типами фильтров, OR внутри brand[] и productSizeId[];
	 *  - счётчик в алерте = count списка;
	 *  - /filters: бренды считаются без фильтра brand, размеры — без productSizeId,
	 *    цена — без min/max (чтобы можно было сменить значение);
	 *  - в фасетах размеров только варианты с amount > 0;
	 *  - сумма count по размерам может быть > числа артикулов (один артикул — несколько размеров).
	 */
	describe('фасеты: матрица пересечений', () => {
		let size75B: ProductSize;
		let size80C: ProductSize;

		const manager = () => app.get(DataSource).manager;
		const filters = async (query: Record<string, unknown> = {}) =>
			(
				await request(app.getHttpServer())
					.get('/api/product-article/filters')
					.query(query)
					.expect(200)
			).body;
		const list = async (query: Record<string, unknown> = {}) =>
			(
				await request(app.getHttpServer())
					.get('/api/product-article')
					.query({ page: 0, itemsPerPage: 20, ...query })
					.expect(200)
			).body;
		const articles = (body: { data: { article: string }[] }) =>
			body.data.map((a) => a.article).sort();
		const brandMap = (body: { brands: { name: string; count: number }[] }) =>
			Object.fromEntries(body.brands.map((b) => [b.name, b.count]));
		const sizeMap = (body: { sizes: { name: string; count: number }[] }) =>
			Object.fromEntries(body.sizes.map((s) => [s.name, s.count]));

		beforeEach(async () => {
			const category = await manager().save(ProductCategory, {
				name: 'Корсетное'
			});
			const subcategory = await manager().save(ProductSubcategory, {
				name: 'Бюстгальтеры',
				productCategory: category
			});
			const color = await manager().save(ProductColor, { name: 'Чёрный' });
			size75B = await manager().save(ProductSize, { name: '75B' });
			size80C = await manager().save(ProductSize, { name: '80C' });

			async function article(
				code: string,
				brand: string,
				price: number,
				variants: [ProductSize, number][]
			) {
				const saved = await manager().save(ProductArticle, {
					article: code,
					name: code,
					brand,
					price,
					isVisible: true,
					productSubcategory: subcategory
				});
				await manager().save(ProductFile, {
					name: `${code}.png`,
					isLogo: true,
					productArticle: saved
				});
				for (const [size, amount] of variants) {
					await manager().save(Product, {
						amount,
						productArticle: saved,
						productColor: color,
						productSize: size
					});
				}
			}

			await article('A1', 'Milavitsa', 100000, [[size75B, 3]]);
			await article('A2', 'Milavitsa', 200000, [[size80C, 2]]);
			await article('A3', 'Janira', 150000, [
				[size75B, 1],
				[size80C, 0]
			]);
			await article('A4', 'Janira', 250000, [[size80C, 5]]);
			await article('A5', 'Sielei', 180000, [[size75B, 0]]);
		});

		it('без фильтров: бренды и размеры только с остатком, цена', async () => {
			const body = await filters();
			expect(brandMap(body)).toEqual({
				Janira: 2,
				Milavitsa: 2
			});
			// A5 не даёт 75B (amount=0); 75B = A1+A3, 80C = A2+A4
			expect(sizeMap(body)).toEqual({ '75B': 2, '80C': 2 });
			expect(body.price).toEqual({ min: 100000, max: 250000 });
			expect(articles(await list())).toEqual(['A1', 'A2', 'A3', 'A4']);
		});

		it('бренд: список сужается; размеры/цена — по бренду; другие бренды остаются в фасетах', async () => {
			expect(articles(await list({ brand: 'Milavitsa' }))).toEqual(['A1', 'A2']);

			const body = await filters({ brand: 'Milavitsa' });
			expect(sizeMap(body)).toEqual({ '75B': 1, '80C': 1 });
			expect(body.price).toEqual({ min: 100000, max: 200000 });
			// omit brand → счётчики брендов как без brand-фильтра
			expect(brandMap(body)).toEqual({
				Janira: 2,
				Milavitsa: 2
			});
		});

		it('размер: только артикулы с этим размером в наличии; бренды сужаются, размеры — нет', async () => {
			expect(articles(await list({ productSizeId: size75B.id }))).toEqual([
				'A1',
				'A3'
			]);
			// A3 имеет 80C с amount=0 — в список по 80C не попадает
			expect(articles(await list({ productSizeId: size80C.id }))).toEqual([
				'A2',
				'A4'
			]);

			const body = await filters({ productSizeId: size75B.id });
			expect(brandMap(body)).toEqual({ Janira: 1, Milavitsa: 1 });
			expect(sizeMap(body)).toEqual({ '75B': 2, '80C': 2 });
			expect(body.price).toEqual({ min: 100000, max: 150000 });
		});

		it('бренд + размер: AND; пустое пересечение; фасеты не запирают свой тип', async () => {
			expect(
				articles(await list({ brand: 'Milavitsa', productSizeId: size75B.id }))
			).toEqual(['A1']);
			expect(
				articles(await list({ brand: 'Milavitsa', productSizeId: size80C.id }))
			).toEqual(['A2']);
			expect(
				(await list({ brand: 'Sielei', productSizeId: size75B.id })).count
			).toBe(0);

			const milavitsa75 = await filters({
				brand: 'Milavitsa',
				productSizeId: size75B.id
			});
			// размеры без учёта выбранного размера, но с брендом → оба размера Milavitsa
			expect(sizeMap(milavitsa75)).toEqual({ '75B': 1, '80C': 1 });
			// бренды без учёта бренда, но с размером 75B
			expect(brandMap(milavitsa75)).toEqual({ Janira: 1, Milavitsa: 1 });
			expect(milavitsa75.price).toEqual({ min: 100000, max: 100000 });
		});

		it('несколько брендов/размеров — OR внутри типа', async () => {
			expect(articles(await list({ brand: ['Milavitsa', 'Sielei'] }))).toEqual([
				'A1',
				'A2'
			]);
			expect(
				articles(await list({ productSizeId: [size75B.id, size80C.id] }))
			).toEqual(['A1', 'A2', 'A3', 'A4']);

			const body = await filters({ brand: ['Milavitsa', 'Janira'] });
			expect(sizeMap(body)).toEqual({ '75B': 2, '80C': 2 });
			expect(body.price).toEqual({ min: 100000, max: 250000 });
		});

		it('цена: список и фасеты согласованы; диапазон цен не сужается сам собой', async () => {
			expect(articles(await list({ minPrice: 180000, maxPrice: 220000 }))).toEqual([
				'A2'
			]);

			const body = await filters({ minPrice: 180000, maxPrice: 220000 });
			// omit price → полный диапазон каталога
			expect(body.price).toEqual({ min: 100000, max: 250000 });
			expect(brandMap(body)).toEqual({ Milavitsa: 1 });
			expect(sizeMap(body)).toEqual({ '80C': 1 });
		});

		it('по умолчанию A5 (без остатка) не в списке и фасетах', async () => {
			expect(articles(await list())).toEqual(['A1', 'A2', 'A3', 'A4']);
			const body = await filters();
			expect(brandMap(body)).toEqual({ Janira: 2, Milavitsa: 2 });
			expect(sizeMap(body)).toEqual({ '75B': 2, '80C': 2 });
			expect(body.price).toEqual({ min: 100000, max: 250000 });
		});

		it('query: поиск по артикулу/бренду сужает список и фасеты', async () => {
			expect(articles(await list({ query: 'A3' }))).toEqual(['A3']);
			expect(articles(await list({ query: 'Janira' }))).toEqual(['A3', 'A4']);

			const byBrand = await filters({ query: 'Milavitsa' });
			expect(brandMap(byBrand)).toEqual({ Milavitsa: 2 });
			expect(sizeMap(byBrand)).toEqual({ '75B': 1, '80C': 1 });
			expect(byBrand.price).toEqual({ min: 100000, max: 200000 });

			const byCodeAndSize = await filters({
				query: 'A1',
				productSizeId: size80C.id
			});
			expect(
				articles(await list({ query: 'A1', productSizeId: size80C.id }))
			).toEqual([]);
			expect(brandMap(byCodeAndSize)).toEqual({});
			expect(sizeMap(byCodeAndSize)).toEqual({ '75B': 1 });
		});

		it('count списка совпадает с алертом; сумма sizes может превышать count', async () => {
			const body = await list({ brand: 'Janira' });
			expect(body.count).toBe(2);
			expect(articles(body)).toEqual(['A3', 'A4']);

			const facets = await filters({ brand: 'Janira' });
			// A3 даёт 75B, A4 даёт 80C → сумма 2 == count; у Milavitsa сумма sizes = 2 == count
			expect(Object.values(sizeMap(facets)).reduce((a, b) => a + b, 0)).toBe(2);

			// артикул с двумя размерами в наличии раздувает сумму
			const zeroStock = await manager().findOneOrFail(Product, {
				where: {
					productArticle: { article: 'A3' },
					productSize: { id: size80C.id }
				}
			});
			await manager().update(Product, zeroStock.id, { amount: 2 });
			const after = await filters({ brand: 'Janira' });
			expect(sizeMap(after)).toEqual({ '75B': 1, '80C': 2 });
			expect(Object.values(sizeMap(after)).reduce((a, b) => a + b, 0)).toBe(3);
			expect((await list({ brand: 'Janira' })).count).toBe(2);
		});
	});

	it('корзина: сохранение, чтение, валидация', async () => {
		const customer = await registerAgent(app, CUSTOMER);
		expect((await customer.get('/api/user/basket').expect(200)).body).toEqual([]);

		const basket = [
			{ productId: 1, amount: 2, id: '7', name: 'Трусы', price: 99000 }
		];
		await customer.put('/api/user/basket').send(basket).expect(200);
		const saved = (await customer.get('/api/user/basket').expect(200)).body;
		expect(saved).toEqual([
			{ productId: 1, amount: 2, id: 7, name: 'Трусы', price: 99000 }
		]);
		expect(typeof saved[0].price).toBe('number');

		await customer
			.put('/api/user/basket')
			.send([{ productId: 'x', amount: -1 }])
			.expect(400);
		await customer
			.put('/api/user/basket')
			.send(Array.from({ length: 101 }, () => ({ productId: 1, amount: 1 })))
			.expect(400);
		await request(app.getHttpServer()).get('/api/user/basket').expect(401);
	});

	it('healthcheck', async () => {
		await request(app.getHttpServer()).get('/api/health').expect(200);
	});
});

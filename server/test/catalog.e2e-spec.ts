import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductCategory } from 'src/db/entities/ProductCategory';
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
			.query({ page: '0', itemsPerPage: '5', minPrice: '1000' })
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
				price: 800,
				isVisible: false,
				variants: [
					[catalog.size, 0],
					[size80C, 2]
				]
			});
			await addArticle('ART-003', {
				brand: 'Janira',
				price: 3000,
				isVisible: true,
				withImage: true,
				variants: [[size80C, 4]]
			});
			await addArticle('ART-004', { price: 100, isVisible: true, archived: true });
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

		it('inStock, цена, сортировка и поиск по бренду работают вместе', async () => {
			await manager().update(Product, { id: catalog.product.id }, { amount: 0 });
			expect(articles(await publicList({ inStock: 'true' }))).toEqual(['ART-003']);
			// inStock=false — это «не фильтровать»
			expect((await publicList({ inStock: 'false' })).count).toBe(2);

			const all = await publicList({ sort: 'priceDesc' });
			expect(articles(all)).toEqual(['ART-003', 'ART-001']);
			expect(articles(await publicList({ sort: 'priceAsc' }))).toEqual([
				'ART-001',
				'ART-003'
			]);
			expect(articles(await publicList({ sort: 'new' }))).toEqual([
				'ART-003',
				'ART-001'
			]);

			expect(articles(await publicList({ minPrice: 2000 }))).toEqual(['ART-003']);
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
				noImage: 'true',
				noStock: 'true'
			});
			expect(articles(body)).toEqual(['ART-001', 'ART-003']);
		});

		it('админка: статус публикации, архив, без фото, без остатка', async () => {
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
			expect(articles(await adminList({ status: 'archive' }))).toEqual(['ART-004']);

			expect(articles(await adminList({ noImage: 'true' }))).toEqual([
				'ART-002',
				'ART-004'
			]);
			// у ART-002 есть остаток 2 в 80C; у ART-004 вариантов нет вовсе
			expect(articles(await adminList({ noStock: 'true' }))).toEqual(['ART-004']);
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
			expect(res.body.price).toEqual({ min: 1500, max: 3000 });

			const narrowed = await request(app.getHttpServer())
				.get('/api/product-article/filters')
				.query({ query: 'milavitsa' })
				.expect(200);
			expect(narrowed.body.brands).toEqual([{ name: 'Milavitsa', count: 1 }]);
			expect(narrowed.body.price).toEqual({ min: 1500, max: 1500 });

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
			expect(res.body.price).toEqual({ min: 3000, max: 3000 });

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
	});

	it('корзина: сохранение, чтение, валидация', async () => {
		const customer = await registerAgent(app, CUSTOMER);
		expect((await customer.get('/api/user/basket').expect(200)).body).toEqual([]);

		const basket = [{ productId: 1, amount: 2, id: '7', name: 'Трусы', price: 990 }];
		await customer.put('/api/user/basket').send(basket).expect(200);
		const saved = (await customer.get('/api/user/basket').expect(200)).body;
		expect(saved).toEqual([
			{ productId: 1, amount: 2, id: 7, name: 'Трусы', price: 990 }
		]);

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

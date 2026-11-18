import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { ProductSize } from 'src/db/entities/ProductSize';
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

	it('фильтр каталога по размеру и бренду', async () => {
		const catalog = await seedCatalog(app);
		const manager = app.get(DataSource).manager;

		await manager.query(
			`UPDATE product_article SET brand = $1 WHERE id = $2`,
			['Milavitsa', catalog.article.id]
		);

		const otherSize = await manager.save(ProductSize, { name: '80C' });

		const bySize = await request(app.getHttpServer())
			.get('/api/product-article')
			.query({ page: 0, itemsPerPage: 10, productSizeId: catalog.size.id })
			.expect(200);
		expect(bySize.body.count).toBe(1);

		const byOtherSize = await request(app.getHttpServer())
			.get('/api/product-article')
			.query({ page: 0, itemsPerPage: 10, productSizeId: otherSize.id })
			.expect(200);
		expect(byOtherSize.body.count).toBe(0);

		const byBrand = await request(app.getHttpServer())
			.get('/api/product-article')
			.query({ page: 0, itemsPerPage: 10, brand: 'milavitsa' })
			.expect(200);
		expect(byBrand.body.count).toBe(1);

		const byUnknownBrand = await request(app.getHttpServer())
			.get('/api/product-article')
			.query({ page: 0, itemsPerPage: 10, brand: 'UnknownBrand' })
			.expect(200);
		expect(byUnknownBrand.body.count).toBe(0);
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

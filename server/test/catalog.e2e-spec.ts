import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
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

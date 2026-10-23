import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp, resetDb, seedCatalog, registerAdmin } from './utils';

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
			.post('/api/product-article/getList')
			.send(listBody)
			.expect(201);
		expect(res.body.count).toBe(1);

		await app
			.get(DataSource)
			.query(`UPDATE product_article SET "isVisible" = false WHERE id = $1`, [
				catalog.article.id
			]);

		res = await request(app.getHttpServer())
			.post('/api/product-article/getList')
			.send(listBody)
			.expect(201);
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
			.post('/api/product-article/admin/getList')
			.send(listBody)
			.expect(201);
		expect(res.body.count).toBe(1);
	});

	it('детальная карточка видимого артикула', async () => {
		const catalog = await seedCatalog(app);
		const res = await request(app.getHttpServer())
			.post(`/api/product-article/${catalog.article.id}`)
			.send({})
			.expect(201);
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

	it('healthcheck', async () => {
		await request(app.getHttpServer()).get('/api/health').expect(200);
	});
});

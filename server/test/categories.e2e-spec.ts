import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { createTestApp, registerAdmin, resetDb, seedCatalog } from './utils';

describe('Категории (e2e)', () => {
	let app: INestApplication;
	let admin: Awaited<ReturnType<typeof registerAdmin>>;

	const createCategory = (name: string) =>
		admin.post('/api/product-category/create').send({ name });
	const createSubcategory = (categoryId: number, name: string) =>
		admin.post('/api/product-category/subcategory/create').send({ categoryId, name });

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
		admin = await registerAdmin(app);
	});

	afterAll(async () => {
		await app.close();
	});

	it('создание, переименование и удаление категории', async () => {
		const created = await createCategory('Пижамы').expect(201);
		expect(created.body).toMatchObject({ name: 'Пижамы' });
		await createCategory('Пижамы').expect(400);

		const renamed = await admin
			.patch('/api/product-category/update')
			.send({ id: created.body.id, name: 'Домашняя одежда' })
			.expect(200);
		expect(renamed.body).toEqual({ id: created.body.id, name: 'Домашняя одежда' });

		await admin.delete(`/api/product-category/delete/${created.body.id}`).expect(200);
		const list = await request(app.getHttpServer())
			.get('/api/product-category')
			.expect(200);
		expect(list.body).toHaveLength(0);

		// после удаления имя снова свободно
		await createCategory('Пижамы').expect(201);
	});

	it('категорию с подкатегориями удалить нельзя', async () => {
		const category = await createCategory('Бельё').expect(201);
		await createSubcategory(category.body.id, 'Трусы').expect(201);
		await admin
			.delete(`/api/product-category/delete/${category.body.id}`)
			.expect(400);
	});

	it('имя подкатегории уникально во всех категориях', async () => {
		const a = await createCategory('Женское').expect(201);
		const b = await createCategory('Мужское').expect(201);
		await createSubcategory(a.body.id, 'Трусы').expect(201);
		await createSubcategory(b.body.id, 'Трусы').expect(400);
	});

	it('подкатегорию с товарами (в т.ч. архивными) удалить нельзя', async () => {
		const catalog = await seedCatalog(app);
		const subcategoryId = catalog.article.productSubcategory.id;
		await app.get(DataSource).manager.softDelete(ProductArticle, catalog.article.id);

		await admin
			.delete(`/api/product-category/subcategory/delete/${subcategoryId}`)
			.expect(400);
	});

	it('перенос артикула в другую подкатегорию', async () => {
		const catalog = await seedCatalog(app);
		const category = await createCategory('Другое').expect(201);
		const target = await createSubcategory(category.body.id, 'Носки').expect(201);

		const res = await admin
			.post('/api/product-category/subcategory/bindProduct')
			.send({ productArticleId: catalog.article.id, subcategoryId: target.body.id })
			.expect(201);
		expect(res.body.productSubcategory.id).toBe(target.body.id);
	});

	it('несуществующая категория — 404', async () => {
		await createSubcategory(9999, 'Что-то').expect(404);
		await admin.delete('/api/product-category/delete/9999').expect(404);
	});
});

import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductFile } from 'src/db/entities/ProductFile';
import { ProductSize } from 'src/db/entities/ProductSize';
import { getDestPath } from 'src/helpers/storageHelper';
import {
	createTestApp,
	orderPayload,
	registerAdmin,
	resetDb,
	SeededCatalog,
	seedCatalog
} from './utils';

const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
	'base64'
);

describe('Админка каталога (e2e)', () => {
	let app: INestApplication;
	let admin: Awaited<ReturnType<typeof registerAdmin>>;
	let catalog: SeededCatalog;

	const manager = () => app.get(DataSource).manager;
	const listBody = { page: 0, itemsPerPage: 20 };
	const publicList = () =>
		request(app.getHttpServer()).get('/api/product-article').query(listBody);
	const update = (body: Record<string, unknown>) =>
		admin.patch(`/api/admin/product-article/${catalog.article.id}`).send(body);
	const uploadImage = (articleId = catalog.article.id) =>
		admin
			.post(`/api/admin/product-article/${articleId}/images`)
			.attach('image', png, 'photo.png');
	const files = () =>
		manager().find(ProductFile, {
			where: { productArticle: { id: catalog.article.id } },
			order: { id: 'ASC' }
		});

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
		admin = await registerAdmin(app);
		catalog = await seedCatalog(app, { withImage: false });
		// seedCatalog создаёт опубликованный артикул; для тестов публикации — скрываем
		await manager().update(ProductArticle, catalog.article.id, { isVisible: false });
	});

	afterAll(async () => {
		await app.close();
	});

	describe('публикация', () => {
		it('без фото опубликовать нельзя, и ничего не сохраняется', async () => {
			const res = await update({ name: 'Новое имя', isVisible: true }).expect(400);
			expect(res.body.error.message).toMatch(/отсутствуют файлы/);

			const article = await manager().findOneBy(ProductArticle, {
				id: catalog.article.id
			});
			expect(article.isVisible).toBe(false);
			expect(article.name).toBe(catalog.article.name);
		});

		it('с фото, именем и вариантом — публикуется и виден на витрине', async () => {
			await uploadImage().expect(201);
			const res = await update({ isVisible: true }).expect(200);
			expect(res.body.isVisible).toBe(true);
			expect((await publicList().expect(200)).body.count).toBe(1);
		});

		it('без вариантов опубликовать нельзя', async () => {
			await uploadImage().expect(201);
			await manager().softDelete(Product, catalog.product.id);
			const res = await update({ isVisible: true }).expect(400);
			expect(res.body.error.message).toMatch(/цвета или размеры/);
		});
	});

	describe('варианты (цвет × размер)', () => {
		let red: ProductColor;
		let size80: ProductSize;

		beforeEach(async () => {
			red = await manager().save(ProductColor, { name: 'Красный' });
			size80 = await manager().save(ProductSize, { name: '80B' });
		});

		it('создаёт все сочетания, лишние уходят в архив, вернувшиеся восстанавливаются с остатком', async () => {
			await update({
				productColorIds: [catalog.color.id, red.id],
				productSizeIds: [catalog.size.id, size80.id]
			}).expect(200);
			expect(await manager().count(Product)).toBe(4);

			// убираем красный: два варианта в архив, исходный вариант с остатком 5 на месте
			const res = await update({ productColorIds: [catalog.color.id] }).expect(200);
			expect(res.body.productColors.map((c) => c.id)).toEqual([catalog.color.id]);
			expect(await manager().count(Product)).toBe(2);
			expect(await manager().count(Product, { withDeleted: true })).toBe(4);

			await update({ productColorIds: [catalog.color.id, red.id] }).expect(200);
			expect(await manager().count(Product, { withDeleted: true })).toBe(4);
			const original = await manager().findOneBy(Product, {
				id: catalog.product.id
			});
			expect(original.amount).toBe(5);
		});

		it('несуществующий цвет — 400 без частичных изменений', async () => {
			await update({ productColorIds: [catalog.color.id, 9999] }).expect(400);
			expect(await manager().count(Product)).toBe(1);
		});

		it('карточка: цвета по выбранному размеру, но все размеры для переключения', async () => {
			await update({
				productColorIds: [catalog.color.id, red.id],
				productSizeIds: [catalog.size.id, size80.id]
			}).expect(200);
			// в размере 80B оставляем только красный
			const blackIn80 = await manager().findOne(Product, {
				where: {
					productColor: { id: catalog.color.id },
					productSize: { id: size80.id }
				}
			});
			await manager().softDelete(Product, blackIn80.id);
			await uploadImage().expect(201);
			await update({ isVisible: true }).expect(200);

			const res = await request(app.getHttpServer())
				.get(`/api/product-article/${catalog.article.id}`)
				.query({ productSizeId: size80.id })
				.expect(200);
			expect(res.body.productColors.map((c) => c.name)).toEqual(['Красный']);
			expect(res.body.productSizes).toHaveLength(2);
		});
	});

	describe('архив', () => {
		beforeEach(async () => {
			await uploadImage().expect(201);
			await update({ isVisible: true }).expect(200);
		});

		it('архивный артикул пропадает с витрины, но виден в админке и в старых заказах', async () => {
			await request(app.getHttpServer())
				.post('/api/order')
				.send(
					orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }])
				)
				.expect(201);

			const res = await update({ is_deleted: true }).expect(200);
			expect(res.body.is_deleted).toBe(true);
			expect(res.body.isVisible).toBe(false);

			expect((await publicList().expect(200)).body.count).toBe(0);
			await request(app.getHttpServer())
				.get(`/api/product-article/${catalog.article.id}`)
				.query({})
				.expect(404);

			const adminList = await admin
				.get('/api/admin/product-article')
				.query(listBody)
				.expect(200);
			expect(adminList.body.data[0].is_deleted).toBe(true);

			// товар архивирован, но строка заказа на месте
			await manager().softDelete(Product, catalog.product.id);
			const orders = await admin
				.get('/api/admin/order')
				.query(listBody)
				.expect(200);
			expect(orders.body.data[0].orderProducts).toHaveLength(1);
		});

		it('архивный артикул заказать нельзя', async () => {
			await update({ is_deleted: true }).expect(200);
			await request(app.getHttpServer())
				.post('/api/order')
				.send(
					orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }])
				)
				.expect(400);
		});

		it('восстановление из архива', async () => {
			await update({ is_deleted: true }).expect(200);
			const res = await update({ is_deleted: false }).expect(200);
			expect(res.body.is_deleted).toBe(false);
		});
	});

	describe('фото', () => {
		it('первое фото — логотип, смена логотипа, удаление логотипа передаёт его следующему', async () => {
			await uploadImage().expect(201);
			await uploadImage().expect(201);
			let [first, second] = await files();
			expect([first.isLogo, second.isLogo]).toEqual([true, false]);
			expect(fs.existsSync(getDestPath(first.name))).toBe(true);

			await admin
				.patch(`/api/admin/product-article/images/${second.id}/logo`)
				.expect(204);
			[first, second] = await files();
			expect([first.isLogo, second.isLogo]).toEqual([false, true]);

			await admin
				.delete(`/api/admin/product-article/images/${second.id}`)
				.expect(204);
			const rest = await files();
			expect(rest).toHaveLength(1);
			expect(rest[0].isLogo).toBe(true);
			expect(fs.existsSync(getDestPath(second.name))).toBe(false);
		});

		it('загрузка фото к несуществующему артикулу — 404', async () => {
			await uploadImage(9999).expect(404);
		});
	});

	it('админ получает вариант и у неопубликованного артикула', async () => {
		await admin
			.get('/api/admin/product')
			.query({
				productArticleId: catalog.article.id,
				productColorId: catalog.color.id,
				productSizeId: catalog.size.id
			})
			.expect(200);
		await request(app.getHttpServer())
			.get('/api/product')
			.query({
				productArticleId: catalog.article.id,
				productColorId: catalog.color.id,
				productSizeId: catalog.size.id
			})
			.expect(404);
	});
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { Product } from 'src/db/entities/Product';
import { TelegramOrderMessage } from 'src/db/entities/TelegramOrderMessage';
import { DeliveryTypeService } from 'src/delivery-type/delivery-type.service';
import {
	ADMIN,
	CUSTOMER,
	createTestApp,
	orderPayload,
	registerAgent,
	resetDb,
	seedCatalog
} from './utils';

describe('Order (e2e)', () => {
	let app: INestApplication;

	const productAmount = async (id: number) =>
		(await app.get(DataSource).manager.findOneBy(Product, { id })).amount;

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
	});

	afterAll(async () => {
		await app.close();
	});

	it('гость создаёт заказ, цена считается на сервере', async () => {
		const catalog = await seedCatalog(app, { amount: 5, price: 1500 });

		const res = await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);

		expect(res.body.price).toBe(3000);
		expect(res.body.status).toBe('create');
		expect(res.body.orderProducts[0]).toMatchObject({ amount: 2, price: 1500 });
	});

	it('при заказе создаётся запись о Telegram-уведомлении', async () => {
		const catalog = await seedCatalog(app);
		const res = await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const message = await app.get(DataSource).manager.findOne(TelegramOrderMessage, {
			where: { order: { id: res.body.id } }
		});
		expect(message).toBeTruthy();
	});

	it('списывает остаток со склада', async () => {
		const catalog = await seedCatalog(app, { amount: 5 });

		await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);

		expect(await productAmount(catalog.product.id)).toBe(3);
	});

	it('не даёт заказать больше, чем есть на складе', async () => {
		const catalog = await seedCatalog(app, { amount: 1 });

		await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(400);
		expect(await productAmount(catalog.product.id)).toBe(1);
	});

	it('параллельные заказы последней единицы: проходит только один', async () => {
		const catalog = await seedCatalog(app, { amount: 1 });
		const payload = orderPayload(catalog, [
			{ productId: catalog.product.id, amount: 1 }
		]);

		const results = await Promise.all(
			Array.from({ length: 5 }, () =>
				request(app.getHttpServer()).post('/api/order/create').send(payload)
			)
		);

		expect(results.filter((r) => r.status === 201)).toHaveLength(1);
		expect(results.filter((r) => r.status === 400)).toHaveLength(4);
		expect(await productAmount(catalog.product.id)).toBe(0);
	});

	it('несуществующий товар — 400', async () => {
		const catalog = await seedCatalog(app);
		await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: 9999, amount: 1 }]))
			.expect(400);
	});

	it('повтор одного товара в заказе — 400, а не 500', async () => {
		const catalog = await seedCatalog(app);
		await request(app.getHttpServer())
			.post('/api/order/create')
			.send(
				orderPayload(catalog, [
					{ productId: catalog.product.id, amount: 1 },
					{ productId: catalog.product.id, amount: 1 }
				])
			)
			.expect(400);
	});

	it('несуществующий способ доставки — 400, а не 500', async () => {
		const catalog = await seedCatalog(app);
		await request(app.getHttpServer())
			.post('/api/order/create')
			.send({
				...orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]),
				deliveryTypeId: 9999
			})
			.expect(400);
		expect(await productAmount(catalog.product.id)).toBe(5);
	});

	it('скрытый товар заказать нельзя', async () => {
		const catalog = await seedCatalog(app);
		await app
			.get(DataSource)
			.query(`UPDATE product_article SET "isVisible" = false WHERE id = $1`, [
				catalog.article.id
			]);

		await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(400);
	});

	it('заказ залогиненного пользователя виден в его списке', async () => {
		await registerAgent(app, ADMIN);
		const customer = await registerAgent(app, CUSTOMER);
		const catalog = await seedCatalog(app);

		await customer
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const res = await customer
			.post('/api/order')
			.send({ page: 0, itemsPerPage: 10 })
			.expect(201);
		expect(res.body.count).toBe(1);
	});

	it('в админском списке позиции хранят цену на момент заказа', async () => {
		const admin = await registerAgent(app, ADMIN);
		const catalog = await seedCatalog(app, { price: 1000 });
		await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		await app
			.get(DataSource)
			.query(`UPDATE product_article SET price = 5000 WHERE id = $1`, [
				catalog.article.id
			]);

		const res = await admin
			.post('/api/order/admin')
			.send({ page: 0, itemsPerPage: 10 })
			.expect(201);
		const [order] = res.body.data;
		expect(order.price).toBe(2000);
		expect(order.orderProducts[0].price).toBe(1000);
	});

	it('админ меняет статус заказа', async () => {
		const admin = await registerAgent(app, ADMIN);
		const catalog = await seedCatalog(app);
		const order = await request(app.getHttpServer())
			.post('/api/order/create')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const res = await admin
			.patch('/api/order/admin/changeStatus')
			.send({ orderId: order.body.id, status: 'in_work' })
			.expect(200);
		expect(res.body.status).toBe('in_work');
	});

	it('ошибка вне HttpException отдаётся в едином формате без подробностей', async () => {
		const spy = jest
			.spyOn(app.get(DeliveryTypeService), 'getList')
			.mockRejectedValueOnce(new Error('секретная внутренняя ошибка'));

		const res = await request(app.getHttpServer())
			.get('/api/delivery-type')
			.expect(500);
		spy.mockRestore();

		expect(res.body.error.statusCode).toBe(500);
		expect(res.body.error.message).toBe('Внутренняя ошибка сервера');
		expect(res.body.error.stack).toBeUndefined();
	});

	it('смена статуса несуществующего заказа — 404', async () => {
		const admin = await registerAgent(app, ADMIN);
		await admin
			.patch('/api/order/admin/changeStatus')
			.send({ orderId: 9999, status: 'in_work' })
			.expect(404);
	});
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { DeliveryType } from 'src/db/entities/DeliveryType';
import { Product } from 'src/db/entities/Product';
import { TelegramOrderMessage } from 'src/db/entities/TelegramOrderMessage';
import { DeliveryTypeService } from 'src/delivery-type/delivery-type.service';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import {
	CUSTOMER,
	createTestApp,
	orderPayload,
	registerAgent,
	resetDb,
	seedCatalog,
	registerAdmin
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
		const catalog = await seedCatalog(app, { amount: 5, price: 150000 });

		const res = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);

		expect(res.body.price).toBe(300000);
		expect(res.body.status).toBe('create');
		expect(res.body.orderProducts[0]).toMatchObject({ amount: 2, price: 150000 });
	});

	it('телефон с маской нормализуется в E.164', async () => {
		const catalog = await seedCatalog(app);
		const res = await request(app.getHttpServer())
			.post('/api/order')
			.send({
				...orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]),
				tel: '+7 (999) 123-45-67'
			})
			.expect(201);
		expect(res.body.tel).toBe('+79991234567');
	});

	it('кривой телефон — 422', async () => {
		const catalog = await seedCatalog(app);
		await request(app.getHttpServer())
			.post('/api/order')
			.send({
				...orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]),
				tel: '12345'
			})
			.expect(422);
	});

	it('при заказе создаётся запись о Telegram-уведомлении', async () => {
		const catalog = await seedCatalog(app);
		const res = await request(app.getHttpServer())
			.post('/api/order')
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
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);

		expect(await productAmount(catalog.product.id)).toBe(3);
	});

	it('не даёт заказать больше, чем есть на складе', async () => {
		const catalog = await seedCatalog(app, { amount: 1 });

		await request(app.getHttpServer())
			.post('/api/order')
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
				request(app.getHttpServer()).post('/api/order').send(payload)
			)
		);

		expect(results.filter((r) => r.status === 201)).toHaveLength(1);
		expect(results.filter((r) => r.status === 400)).toHaveLength(4);
		expect(await productAmount(catalog.product.id)).toBe(0);
	});

	it('несуществующий товар — 400', async () => {
		const catalog = await seedCatalog(app);
		await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: 9999, amount: 1 }]))
			.expect(400);
	});

	it('повтор одного товара в заказе — 400, а не 500', async () => {
		const catalog = await seedCatalog(app);
		await request(app.getHttpServer())
			.post('/api/order')
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
			.post('/api/order')
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
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(400);
	});

	it('заказ залогиненного пользователя виден в его списке', async () => {
		await registerAdmin(app);
		const customer = await registerAgent(app, CUSTOMER);
		const catalog = await seedCatalog(app);

		const created = await customer
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const res = await customer
			.get('/api/order')
			.query({ page: 0, itemsPerPage: 10 })
			.expect(200);
		expect(res.body.count).toBe(1);
		expect(res.body.data).toHaveLength(1);
		const [order] = res.body.data;
		expect(order.id).toBe(created.body.id);
		expect(order.status).toBe('create');
		expect(order.price).toBe(created.body.price);
		expect(order.created_at).toBeTruthy();
		expect(Array.isArray(order.orderProducts)).toBe(true);
		expect(order.orderProducts.length).toBeGreaterThan(0);
		expect(order.orderProducts[0].product?.productArticle?.name).toBeTruthy();
	});

	it('клиентский список фильтрует по scope=active|completed и пагинирует', async () => {
		const admin = await registerAdmin(app);
		const customer = await registerAgent(app, CUSTOMER);
		const catalog = await seedCatalog(app, { amount: 20 });

		const activeOrder = await customer
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const cancelledOrder = await customer
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const closedOrder = await customer
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		await admin
			.patch(`/api/admin/order/${cancelledOrder.body.id}`)
			.send({ status: 'cancelled' })
			.expect(200);

		for (const status of ['in_work', 'payment', 'delivery', 'close'] as const) {
			await admin
				.patch(`/api/admin/order/${closedOrder.body.id}`)
				.send({ status })
				.expect(200);
		}

		const defaultList = await customer
			.get('/api/order')
			.query({ page: 0, itemsPerPage: 10 })
			.expect(200);
		expect(defaultList.body.count).toBe(1);
		expect(defaultList.body.data.map((o: { id: number }) => o.id)).toEqual([
			activeOrder.body.id
		]);

		const activeList = await customer
			.get('/api/order')
			.query({ page: 0, itemsPerPage: 10, scope: 'active' })
			.expect(200);
		expect(activeList.body.count).toBe(1);
		expect(activeList.body.data[0].id).toBe(activeOrder.body.id);

		const completedList = await customer
			.get('/api/order')
			.query({ page: 0, itemsPerPage: 10, scope: 'completed' })
			.expect(200);
		expect(completedList.body.count).toBe(2);
		expect(completedList.body.data.map((o: { id: number }) => o.id).sort()).toEqual(
			[cancelledOrder.body.id, closedOrder.body.id].sort()
		);
		expect(
			completedList.body.data.every((o: { status: string }) =>
				['close', 'cancelled'].includes(o.status)
			)
		).toBe(true);

		const page0 = await customer
			.get('/api/order')
			.query({ page: 0, itemsPerPage: 1, scope: 'completed' })
			.expect(200);
		expect(page0.body.count).toBe(2);
		expect(page0.body.data).toHaveLength(1);

		const page1 = await customer
			.get('/api/order')
			.query({ page: 1, itemsPerPage: 1, scope: 'completed' })
			.expect(200);
		expect(page1.body.count).toBe(2);
		expect(page1.body.data).toHaveLength(1);
		expect(page1.body.data[0].id).not.toBe(page0.body.data[0].id);

		await customer
			.get('/api/order')
			.query({ page: 0, itemsPerPage: 10, scope: 'all' })
			.expect(422);
	});

	it('в админском списке позиции хранят цену на момент заказа', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app, { price: 100000 });
		await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		await app
			.get(DataSource)
			.query(`UPDATE product_article SET price = 5000 WHERE id = $1`, [
				catalog.article.id
			]);

		const res = await admin
			.get('/api/admin/order')
			.query({ page: 0, itemsPerPage: 10 })
			.expect(200);
		const [order] = res.body.data;
		expect(order.price).toBe(200000);
		expect(order.orderProducts[0].price).toBe(100000);
	});

	it('админ фильтрует заказы по query, status и deliveryTypeId', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app, { amount: 10 });
		const courier = await app
			.get(DataSource)
			.manager.save(DeliveryType, { name: 'Курьер' });

		await request(app.getHttpServer())
			.post('/api/order')
			.send({
				...orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]),
				fio: 'Алиса Смирнова',
				mail: 'alice@example.com',
				tel: '+79991112233'
			})
			.expect(201);

		const second = await request(app.getHttpServer())
			.post('/api/order')
			.send({
				...orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]),
				fio: 'Боб Петров',
				mail: 'bob@example.com',
				tel: '+79994445566',
				deliveryTypeId: courier.id
			})
			.expect(201);

		await admin
			.patch(`/api/admin/order/${second.body.id}`)
			.send({ status: 'in_work' })
			.expect(200);

		const byQuery = await admin
			.get('/api/admin/order')
			.query({ page: 0, itemsPerPage: 10, query: 'alice@' })
			.expect(200);
		expect(byQuery.body.count).toBe(1);
		expect(byQuery.body.data[0].mail).toBe('alice@example.com');

		const byStatus = await admin
			.get('/api/admin/order')
			.query({ page: 0, itemsPerPage: 10, status: 'in_work' })
			.expect(200);
		expect(byStatus.body.count).toBe(1);
		expect(byStatus.body.data[0].id).toBe(second.body.id);

		const byDelivery = await admin
			.get('/api/admin/order')
			.query({ page: 0, itemsPerPage: 10, deliveryTypeId: courier.id })
			.expect(200);
		expect(byDelivery.body.count).toBe(1);
		expect(byDelivery.body.data[0].deliveryType.id).toBe(courier.id);
	});

	it('ответы с заказами не раскрывают пароль и служебные поля пользователя', async () => {
		const admin = await registerAdmin(app);
		const customer = await registerAgent(app, CUSTOMER);
		const catalog = await seedCatalog(app);
		await customer
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);
		await app.get(OrderNotificationService).waitForPendingNotifications();

		const responses = [
			await admin
				.get('/api/admin/order')
				.query({ page: 0, itemsPerPage: 10 })
				.expect(200),
			await admin.get('/api/admin/order/telegram-failed').expect(200),
			await customer
				.get('/api/order')
				.query({ page: 0, itemsPerPage: 10 })
				.expect(200),
			await customer.get('/api/auth/me').expect(200)
		];
		for (const res of responses) {
			expect(JSON.stringify(res.body)).not.toMatch(
				/password|\$2[aby]\$|basket|role/
			);
		}
		const [adminList, failed] = responses;
		expect(adminList.body.data[0].user.mail).toBe(CUSTOMER.mail);
		expect(failed.body[0].user.mail).toBe(CUSTOMER.mail);
	});

	it('админ меняет статус заказа', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app);
		const order = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		const res = await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'in_work' })
			.expect(200);
		expect(res.body.status).toBe('in_work');
	});

	it('разрешённый переход create → in_work → payment', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app);
		const order = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'in_work' })
			.expect(200);

		const res = await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'payment' })
			.expect(200);
		expect(res.body.status).toBe('payment');
	});

	it('запрещённый переход in_work → delivery — 400', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app);
		const order = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);

		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'in_work' })
			.expect(200);

		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'delivery' })
			.expect(400);
	});

	it('cancelled → in_work разрешён и снова списывает склад', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app, { amount: 5 });

		const order = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		expect(await productAmount(catalog.product.id)).toBe(3);

		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'cancelled' })
			.expect(200);
		expect(await productAmount(catalog.product.id)).toBe(5);

		const res = await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'in_work' })
			.expect(200);
		expect(res.body.status).toBe('in_work');
		expect(await productAmount(catalog.product.id)).toBe(3);
	});

	it('cancelled → in_work — 400 при недостаточном остатке', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app, { amount: 2 });

		const order = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'cancelled' })
			.expect(200);
		expect(await productAmount(catalog.product.id)).toBe(2);

		await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		expect(await productAmount(catalog.product.id)).toBe(0);

		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'in_work' })
			.expect(400);
		expect(await productAmount(catalog.product.id)).toBe(0);
	});

	it('close остаётся терминальным', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app, { amount: 5 });

		const closedOrder = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 1 }]))
			.expect(201);
		for (const status of ['in_work', 'payment', 'delivery', 'close'] as const) {
			await admin
				.patch(`/api/admin/order/${closedOrder.body.id}`)
				.send({ status })
				.expect(200);
		}
		await admin
			.patch(`/api/admin/order/${closedOrder.body.id}`)
			.send({ status: 'cancelled' })
			.expect(400);
	});

	it('отмена заказа возвращает остаток на склад', async () => {
		const admin = await registerAdmin(app);
		const catalog = await seedCatalog(app, { amount: 5 });
		const order = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		expect(await productAmount(catalog.product.id)).toBe(3);

		const res = await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'cancelled' })
			.expect(200);
		expect(res.body.status).toBe('cancelled');
		expect(await productAmount(catalog.product.id)).toBe(5);

		await admin
			.patch(`/api/admin/order/${order.body.id}`)
			.send({ status: 'cancelled' })
			.expect(400);
		expect(await productAmount(catalog.product.id)).toBe(5);
	});

	it('ошибка вне HttpException отдаётся в едином формате без подробностей', async () => {
		const spy = vi
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
		const admin = await registerAdmin(app);
		await admin
			.patch('/api/admin/order/9999')
			.send({ status: 'in_work' })
			.expect(404);
	});
});

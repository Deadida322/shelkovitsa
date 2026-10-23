import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { Order } from 'src/db/entities/Order';
import {
	TelegramMessageStatus,
	TelegramOrderMessage
} from 'src/db/entities/TelegramOrderMessage';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import { createTestApp, orderPayload, resetDb, seedCatalog } from './utils';

describe('Telegram-уведомления (e2e)', () => {
	let app: INestApplication;
	let sendMessage: jest.Mock;
	let service: OrderNotificationService;

	const messageOf = (orderId: number) =>
		app
			.get(DataSource)
			.manager.findOne(TelegramOrderMessage, { where: { order: { id: orderId } } });

	const createOrder = async () => {
		const catalog = await seedCatalog(app, { price: 1000 });
		const res = await request(app.getHttpServer())
			.post('/api/order')
			.send(orderPayload(catalog, [{ productId: catalog.product.id, amount: 2 }]))
			.expect(201);
		await app.get(OrderNotificationService).waitForPendingNotifications();
		return res.body.id as number;
	};

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
		sendMessage = jest.fn().mockResolvedValue({ message_id: 42 });
		const config = {
			get: (key: string) =>
				({ TELEGRAM_ENABLED: 'true', CHAT_TG_ID: '-100500' })[key] ??
				app.get(ConfigService).get(key)
		} as unknown as ConfigService;
		const dataSource = app.get(DataSource);
		// Сервис с поддельным ботом — без обращения к настоящему Telegram API
		service = new OrderNotificationService(
			dataSource.getRepository(Order),
			dataSource.getRepository(TelegramOrderMessage),
			{ telegram: { sendMessage } } as any,
			config
		);
	});

	afterAll(async () => {
		await app.close();
	});

	it('при выключенном Telegram заказ помечается FAILED с причиной', async () => {
		const orderId = await createOrder();
		const message = await messageOf(orderId);
		expect(message.status).toBe(TelegramMessageStatus.FAILED);
		expect(message.errorMessage).toMatch(/TELEGRAM_ENABLED=false/);
	});

	it('успешная отправка: SENT и message_id', async () => {
		const orderId = await createOrder();
		const result = await service.retryTelegramMessage(orderId);

		expect(result.success).toBe(true);
		expect(sendMessage).toHaveBeenCalledWith(
			-100500,
			expect.stringContaining(`Новый заказ #${orderId}`),
			{ parse_mode: 'HTML' }
		);
		const message = await messageOf(orderId);
		expect(message.status).toBe(TelegramMessageStatus.SENT);
		expect(message.telegramMessageId).toBe(42);
	});

	it('ошибка Telegram: FAILED, текст ошибки и счётчик попыток', async () => {
		const orderId = await createOrder();
		sendMessage.mockRejectedValue({
			response: { description: 'Bad Request: chat not found' }
		});

		const result = await service.retryTelegramMessage(orderId);

		expect(result.success).toBe(false);
		const message = await messageOf(orderId);
		expect(message.status).toBe(TelegramMessageStatus.FAILED);
		expect(message.errorMessage).toMatch(/chat not found/);
		expect(message.retryCount).toBe(1);
	});

	it('cron повторно отправляет неудачные сообщения', async () => {
		const orderId = await createOrder();

		await service.retryFailedTelegramMessages();

		expect(sendMessage).toHaveBeenCalledTimes(1);
		expect((await messageOf(orderId)).status).toBe(TelegramMessageStatus.SENT);
	});

	it('уже отправленное сообщение повторно не отправляется', async () => {
		const orderId = await createOrder();
		await service.retryTelegramMessage(orderId);
		await service.retryTelegramMessage(orderId);
		expect(sendMessage).toHaveBeenCalledTimes(1);
	});
});

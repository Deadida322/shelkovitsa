import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MailService } from 'src/mail/mail.service';
import { OrderNotificationService } from 'src/telegram/order-notification.service';
import { createTestApp, orderPayload, resetDb, seedCatalog } from './utils';

describe('Order → mail (e2e)', () => {
	let app: INestApplication;
	let mail: MailService;

	beforeAll(async () => {
		app = await createTestApp();
		mail = app.get(MailService);
	});

	beforeEach(async () => {
		await resetDb(app);
		mail.clearSentMails();
	});

	afterAll(async () => {
		await app.close();
	});

	it('при создании заказа уходят письма админу и клиенту', async () => {
		const catalog = await seedCatalog(app, { price: 150000 });
		const payload = orderPayload(catalog, [
			{ productId: catalog.product.id, amount: 2 }
		]);

		const res = await request(app.getHttpServer())
			.post('/api/order')
			.send(payload)
			.expect(201);

		await app.get(OrderNotificationService).waitForPendingNotifications();

		const sent = mail.getSentMails();
		expect(sent).toHaveLength(2);

		const admin = sent.find((m) => String(m.to).includes('orders@test.local'));
		const customer = sent.find((m) => String(m.to).includes(payload.mail));

		expect(admin?.subject).toBe(`Новый заказ #${res.body.id}`);
		expect(admin?.text || admin?.html).toContain(payload.fio);
		expect(admin?.text || admin?.html).toContain(payload.tel);
		expect(admin?.text || admin?.html).toContain('3000,00');

		expect(customer?.subject).toBe(`Заказ #${res.body.id} принят`);
		expect(customer?.text || customer?.html).toMatch(/принят/i);
		expect(customer?.text || customer?.html).toContain('Ожидайте связи');
	});
});

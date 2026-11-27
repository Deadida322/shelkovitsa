import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { PasswordResetToken } from 'src/db/entities/PasswordResetToken';
import { MailService } from 'src/mail/mail.service';
import { verifyPassword } from 'src/helpers/authHelper';
import { User } from 'src/db/entities/User';
import { CUSTOMER, createTestApp, registerAgent, resetDb } from './utils';

describe('Auth password reset (e2e)', () => {
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

	it('forgot → письмо со ссылкой; reset меняет пароль', async () => {
		await registerAgent(app, CUSTOMER);

		await request(app.getHttpServer())
			.post('/api/auth/forgot')
			.send({ mail: CUSTOMER.mail })
			.expect(201);

		const resetMail = mail
			.getSentMails()
			.find((m) => String(m.subject).includes('Сброс'));
		expect(resetMail).toBeTruthy();
		const body = resetMail?.text || resetMail?.html || '';
		const match = body.match(/token=([a-f0-9]+)/i);
		expect(match?.[1]).toBeTruthy();
		const token = match![1];

		const tokenHash = createHash('sha256').update(token).digest('hex');
		const stored = await app.get(DataSource).manager.findOne(PasswordResetToken, {
			where: { tokenHash }
		});
		expect(stored).toBeTruthy();

		await request(app.getHttpServer())
			.post('/api/auth/reset')
			.send({
				token,
				password: 'new-secret-9',
				rePassword: 'new-secret-9'
			})
			.expect(201);

		const user = await app
			.get(DataSource)
			.manager.findOneByOrFail(User, { mail: CUSTOMER.mail });
		expect(await verifyPassword('new-secret-9', user.password)).toBe(true);

		await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: CUSTOMER.mail, password: 'new-secret-9' })
			.expect(201);
	});

	it('forgot для неизвестного email не падает и не шлёт письмо', async () => {
		await request(app.getHttpServer())
			.post('/api/auth/forgot')
			.send({ mail: 'nobody@test.local' })
			.expect(201);
		expect(mail.getSentMails()).toHaveLength(0);
	});

	it('повторный reset тем же токеном — 400', async () => {
		await registerAgent(app, CUSTOMER);
		await request(app.getHttpServer())
			.post('/api/auth/forgot')
			.send({ mail: CUSTOMER.mail })
			.expect(201);

		const body = mail.getSentMails()[0]?.text || mail.getSentMails()[0]?.html || '';
		const token = body.match(/token=([a-f0-9]+)/i)![1];

		await request(app.getHttpServer())
			.post('/api/auth/reset')
			.send({ token, password: 'new-secret-9', rePassword: 'new-secret-9' })
			.expect(201);

		await request(app.getHttpServer())
			.post('/api/auth/reset')
			.send({ token, password: 'another-pass', rePassword: 'another-pass' })
			.expect(400);
	});
});

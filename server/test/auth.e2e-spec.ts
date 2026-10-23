import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HmacSHA256 } from 'crypto-js';
import { DataSource } from 'typeorm';
import { ADMIN, CUSTOMER, createTestApp, registerAgent, resetDb } from './utils';

describe('Auth (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		app = await createTestApp();
	});

	beforeEach(async () => {
		await resetDb(app);
	});

	afterAll(async () => {
		await app.close();
	});

	it('регистрация ставит httpOnly куку и не отдаёт пароль', async () => {
		const res = await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ ...CUSTOMER, rePassword: CUSTOMER.password })
			.expect(201);

		expect(res.body.mail).toBe(CUSTOMER.mail);
		expect(res.body.password).toBeUndefined();
		const cookie = [].concat(res.headers['set-cookie']).join(';');
		expect(cookie).toMatch(/access_token=/);
		expect(cookie).toMatch(/HttpOnly/i);
	});

	it('не даёт зарегистрироваться дважды на одну почту', async () => {
		await registerAgent(app, CUSTOMER);
		await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ ...CUSTOMER, rePassword: CUSTOMER.password })
			.expect(400);
	});

	it('проверяет совпадение паролей', async () => {
		await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ ...CUSTOMER, rePassword: 'other' })
			.expect(400);
	});

	it('валидирует тело запроса (422)', async () => {
		const res = await request(app.getHttpServer())
			.post('/api/auth/register')
			.send({ mail: 'not-an-email' })
			.expect(422);
		expect(res.body.error.message).toBeInstanceOf(Array);
	});

	it('логин с верным и неверным паролем', async () => {
		await registerAgent(app, ADMIN);
		await registerAgent(app, CUSTOMER);

		await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: CUSTOMER.mail, password: 'wrong' })
			.expect(401);

		const res = await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: CUSTOMER.mail, password: CUSTOMER.password })
			.expect(201);
		expect(res.body.isAdmin).toBe(false);
	});

	it('пароль хранится как bcrypt-хеш', async () => {
		await registerAgent(app, CUSTOMER);
		const [{ password }] = await app
			.get(DataSource)
			.query(`SELECT password FROM "user" WHERE mail = $1`, [CUSTOMER.mail]);
		expect(password).toMatch(/^\$2[aby]\$/);
	});

	it('пользователь со старым HMAC-хешем входит, и хеш обновляется до bcrypt', async () => {
		const legacyHash = HmacSHA256(CUSTOMER.password, process.env.PSD_KEY).toString();
		await app
			.get(DataSource)
			.query(`INSERT INTO "user" (fio, mail, password) VALUES ($1, $2, $3)`, [
				CUSTOMER.fio,
				CUSTOMER.mail,
				legacyHash
			]);

		await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: CUSTOMER.mail, password: 'wrong' })
			.expect(401);
		await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: CUSTOMER.mail, password: CUSTOMER.password })
			.expect(201);

		const [{ password }] = await app
			.get(DataSource)
			.query(`SELECT password FROM "user" WHERE mail = $1`, [CUSTOMER.mail]);
		expect(password).toMatch(/^\$2[aby]\$/);

		// повторный вход уже по bcrypt
		await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: CUSTOMER.mail, password: CUSTOMER.password })
			.expect(201);
	});

	it('первый пользователь (OWNER_ID) — админ, остальные нет', async () => {
		const admin = await registerAgent(app, ADMIN);
		const customer = await registerAgent(app, CUSTOMER);

		expect((await admin.get('/api/auth/me').expect(200)).body.isAdmin).toBe(true);
		expect((await customer.get('/api/auth/me').expect(200)).body.isAdmin).toBe(false);
	});

	it('защищённые маршруты: 401 без куки, 403 для не-админа', async () => {
		await registerAgent(app, ADMIN);
		const customer = await registerAgent(app, CUSTOMER);
		const listBody = { page: 0, itemsPerPage: 10 };

		await request(app.getHttpServer()).get('/api/auth/me').expect(401);
		await request(app.getHttpServer())
			.post('/api/order/admin')
			.send(listBody)
			.expect(401);
		await customer.post('/api/order/admin').send(listBody).expect(403);
	});

	it('мусорный токен на публичном маршруте не мешает', async () => {
		await request(app.getHttpServer())
			.get('/api/product-category')
			.set('Cookie', 'access_token=garbage-token')
			.expect(200);
	});

	it('удалённый пользователь теряет доступ по старому токену', async () => {
		await registerAgent(app, ADMIN);
		const customer = await registerAgent(app, CUSTOMER);
		const dataSource = app.get(DataSource);
		await dataSource.query(`UPDATE "user" SET is_deleted = true WHERE mail = $1`, [
			CUSTOMER.mail
		]);

		await customer.get('/api/auth/me').expect(401);
	});

	it('logout сбрасывает куку', async () => {
		const customer = await registerAgent(app, CUSTOMER);
		await customer.post('/api/auth/logout').expect(201);
		await customer.get('/api/auth/me').expect(401);
	});
});

import { INestApplication } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { CUSTOMER, createTestApp, registerAgent, resetDb, registerAdmin } from './utils';

const execFileAsync = promisify(execFile);

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
		await registerAdmin(app);
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

	it('права админа даёт роль, а не порядок регистрации', async () => {
		const customer = await registerAgent(app, CUSTOMER);
		const admin = await registerAdmin(app);

		expect((await customer.get('/api/auth/me').expect(200)).body.isAdmin).toBe(false);
		expect((await admin.get('/api/auth/me').expect(200)).body.isAdmin).toBe(true);
	});

	it('CLI admin:create создаёт админа и повышает существующего пользователя', async () => {
		const runCli = (...args: string[]) =>
			execFileAsync(
				process.execPath,
				[
					'-r',
					'ts-node/register',
					'-r',
					'tsconfig-paths/register',
					'src/cli/create-admin.ts',
					...args
				],
				{ env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' } }
			);

		await runCli('boss@test.ru', 'boss-password');
		const boss = await request(app.getHttpServer())
			.post('/api/auth/login')
			.send({ mail: 'boss@test.ru', password: 'boss-password' })
			.expect(201);
		expect(boss.body.isAdmin).toBe(true);

		const customer = await registerAgent(app, CUSTOMER);
		expect((await customer.get('/api/auth/me').expect(200)).body.isAdmin).toBe(false);
		await runCli(CUSTOMER.mail, 'new-password-123');
		expect((await customer.get('/api/auth/me').expect(200)).body.isAdmin).toBe(true);

		await expect(runCli('short@test.ru', '123')).rejects.toThrow();
	});

	it('защищённые маршруты: 401 без куки, 403 для не-админа', async () => {
		await registerAdmin(app);
		const customer = await registerAgent(app, CUSTOMER);
		const listBody = { page: 0, itemsPerPage: 10 };

		await request(app.getHttpServer()).get('/api/auth/me').expect(401);
		await request(app.getHttpServer())
			.get('/api/admin/order')
			.query(listBody)
			.expect(401);
		await customer.get('/api/admin/order').query(listBody).expect(403);
	});

	it('мусорный токен на публичном маршруте не мешает', async () => {
		await request(app.getHttpServer())
			.get('/api/product-category')
			.set('Cookie', 'access_token=garbage-token')
			.expect(200);
	});

	it('удалённый пользователь теряет доступ по старому токену', async () => {
		await registerAdmin(app);
		const customer = await registerAgent(app, CUSTOMER);
		const dataSource = app.get(DataSource);
		await dataSource.query(`UPDATE "user" SET deleted_at = now() WHERE mail = $1`, [
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

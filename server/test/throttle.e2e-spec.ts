import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Rate limiting (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		// В остальных тестах лимиты выключены. ConfigModule читает env при импорте,
		// поэтому приложение подгружаем только после включения лимитов.
		process.env.THROTTLE_ENABLED = 'true';
		const { createTestApp, resetDb } = await import('./utils');
		app = await createTestApp();
		await resetDb(app);
	});

	afterAll(async () => {
		await app.close();
		process.env.THROTTLE_ENABLED = 'false';
	});

	it('логин: после 10 попыток в минуту — 429', async () => {
		const attempts = [];
		for (let i = 0; i < 11; i++) {
			attempts.push(
				await request(app.getHttpServer())
					.post('/api/auth/login')
					.send({ mail: 'nobody@test.ru', password: 'wrong' })
			);
		}

		expect(attempts.slice(0, 10).every((res) => res.status === 401)).toBe(true);
		expect(attempts[10].status).toBe(429);
	});

	it('публичные маршруты не упираются в строгий лимит auth', async () => {
		for (let i = 0; i < 15; i++) {
			await request(app.getHttpServer()).get('/api/product-category').expect(200);
		}
	});
});

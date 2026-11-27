import { validateEnv } from './env.validation';

const validEnv = {
	DB_HOST: 'localhost',
	DB_USER: 'postgres',
	DB_PASSWORD: 'postgres',
	DB_NAME: 'shelkovitsa',
	JWT_SECRET: 'secret',
	JWT_EXPIRES_IN: '1 day',
	TEMP_PATH: 'temp/src',
	DEST_PATH: 'temp/dist'
};

describe('validateEnv', () => {
	it('приводит числа и подставляет значения по умолчанию', () => {
		const env = validateEnv({ ...validEnv, DB_PORT: '5433' });
		expect(env.DB_PORT).toBe(5433);
		expect(env.PORT).toBe(8000);
		expect(env.NODE_ENV).toBe('development');
	});

	it('называет все отсутствующие и некорректные переменные', () => {
		const withoutSecret: Record<string, string> = { ...validEnv };
		delete withoutSecret.JWT_SECRET;
		expect(() =>
			validateEnv({ ...withoutSecret, NODE_ENV: 'prod', PORT: 'abc' })
		).toThrow(/JWT_SECRET[\s\S]*NODE_ENV|NODE_ENV[\s\S]*JWT_SECRET/);
		expect(() => validateEnv({ ...withoutSecret, PORT: 'abc' })).toThrow(/PORT/);
	});

	it('TELEGRAM_ENABLED и THROTTLE_ENABLED — только true/false', () => {
		expect(() => validateEnv({ ...validEnv, TELEGRAM_ENABLED: 'yes' })).toThrow(
			/TELEGRAM_ENABLED/
		);
		expect(() =>
			validateEnv({ ...validEnv, THROTTLE_ENABLED: 'false' })
		).not.toThrow();
	});

	it('при SMTP_HOST требует порт и адреса писем; USER/PASS опциональны', () => {
		expect(() => validateEnv({ ...validEnv, SMTP_HOST: 'smtp.example.com' })).toThrow(
			/SMTP_PORT|MAIL_FROM|MAIL_ORDER_TO/
		);
		expect(() =>
			validateEnv({
				...validEnv,
				SMTP_HOST: 'localhost',
				SMTP_PORT: '1025',
				MAIL_FROM: 'shop@example.com',
				MAIL_ORDER_TO: 'orders@example.com'
			})
		).not.toThrow();
		expect(() =>
			validateEnv({
				...validEnv,
				SMTP_HOST: 'smtp.example.com',
				SMTP_PORT: '587',
				SMTP_USER: 'u',
				SMTP_PASS: 'p',
				MAIL_FROM: 'shop@example.com',
				MAIL_ORDER_TO: 'orders@example.com'
			})
		).not.toThrow();
	});
});

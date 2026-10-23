// Переменные окружения для e2e-тестов. Выставляются до импорта приложения,
// поэтому dotenv (который не перезаписывает существующие значения) их не перебьёт.
const testEnv: Record<string, string> = {
	NODE_ENV: 'test',
	PORT: '0',
	DB_HOST: process.env.TEST_DB_HOST ?? 'localhost',
	DB_PORT: process.env.TEST_DB_PORT ?? '5432',
	DB_USER: process.env.TEST_DB_USER ?? 'postgres',
	DB_PASSWORD: process.env.TEST_DB_PASSWORD ?? 'postgres',
	DB_NAME: process.env.TEST_DB_NAME ?? 'shelkovitsa_test',
	JWT_SECRET: 'test-public-key',
	JWT_EXPIRES_IN: '1 day',
	TEMP_PATH: 'temp/test/src',
	DEST_PATH: 'temp/test/dist',
	CORS: 'http://localhost:3000',
	THROTTLE_ENABLED: 'false',
	TELEGRAM_ENABLED: 'false',
	TELEGRAM_TOKEN: '',
	CHAT_TG_ID: '',
	ADMIN_TG_ID: ''
};

Object.assign(process.env, testEnv);

export {};

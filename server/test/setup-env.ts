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

// Прогон на S3-драйвере (RustFS/MinIO из docker-compose или CI):
// TEST_STORAGE_DRIVER=s3 TEST_S3_ENDPOINT=http://localhost:9000 npm run test:e2e
if (process.env.TEST_STORAGE_DRIVER === 's3') {
	Object.assign(process.env, {
		STORAGE_DRIVER: 's3',
		S3_ENDPOINT: process.env.TEST_S3_ENDPOINT ?? 'http://localhost:9000',
		S3_REGION: 'us-east-1',
		S3_BUCKET: process.env.TEST_S3_BUCKET ?? 'shelkovitsa-test',
		S3_ACCESS_KEY: process.env.TEST_S3_ACCESS_KEY ?? 'rustfsadmin',
		S3_SECRET_KEY: process.env.TEST_S3_SECRET_KEY ?? 'rustfsadmin',
		S3_FORCE_PATH_STYLE: 'true'
	});
}

export {};

import { Client } from 'pg';

// Один раз перед всеми тестами: пересоздать тестовую БД.
// Модули приложения здесь не импортируем — globalSetup выполняется вне Vite-трансформа;
// миграции накатывает createTestApp.
export default async function globalSetup() {
	await import('./setup-env');

	const admin = new Client({
		host: process.env.DB_HOST,
		port: +process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: 'postgres'
	});
	await admin.connect();
	await admin.query(`DROP DATABASE IF EXISTS "${process.env.DB_NAME}" WITH (FORCE)`);
	await admin.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
	await admin.end();
}

import { Client } from 'pg';

// Один раз перед всеми тестами: создать тестовую БД (если нет) и накатить миграции
export default async function globalSetup() {
	require('./setup-env');

	const admin = new Client({
		host: process.env.DB_HOST,
		port: +process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: 'postgres'
	});
	await admin.connect();
	const { rowCount } = await admin.query(
		'SELECT 1 FROM pg_database WHERE datname = $1',
		[process.env.DB_NAME]
	);
	if (!rowCount) {
		await admin.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
	}
	await admin.end();

	const { default: dataSource } = await import('../src/db/datasource');
	await dataSource.initialize();
	await dataSource.runMigrations();
	await dataSource.destroy();
}

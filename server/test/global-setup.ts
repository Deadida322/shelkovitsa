import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
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

	if (process.env.STORAGE_DRIVER === 's3') {
		const s3 = new S3Client({
			endpoint: process.env.S3_ENDPOINT,
			region: process.env.S3_REGION,
			forcePathStyle: true,
			credentials: {
				accessKeyId: process.env.S3_ACCESS_KEY,
				secretAccessKey: process.env.S3_SECRET_KEY
			}
		});
		await s3
			.send(new CreateBucketCommand({ Bucket: process.env.S3_BUCKET }))
			.catch((error) => {
				if (
					!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(
						error.name
					)
				) {
					throw error;
				}
			});
	}
}

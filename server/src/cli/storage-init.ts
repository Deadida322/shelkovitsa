import 'dotenv/config';
import { ensureBucket, s3ClientFromEnv } from 'src/storage/s3-bucket';

// Подготовка S3-бакета: npm run storage:init [-- --public]
// --public — анонимное чтение (нужно, если /static редиректит на S3_PUBLIC_URL)
async function main() {
	const bucket = process.env.S3_BUCKET;
	if (!bucket) {
		console.error('Не задан S3_BUCKET (и STORAGE_DRIVER=s3) в .env');
		process.exit(1);
	}
	const publicRead = process.argv.includes('--public');
	const { created } = await ensureBucket(s3ClientFromEnv(), bucket, publicRead);
	console.log(
		`Бакет ${bucket}: ${created ? 'создан' : 'уже был'}${publicRead ? ', публичное чтение включено' : ''}`
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

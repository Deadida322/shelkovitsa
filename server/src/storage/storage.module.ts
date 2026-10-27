import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { baseDestPath } from 'src/helpers/storageHelper';
import { LocalFileStorage } from './local.storage';
import { S3FileStorage } from './s3.storage';
import { FILE_STORAGE, FileStorage } from './storage.types';

// Драйвер S3: бакет готовит npm run storage:init (см. src/storage/s3-bucket.ts)
export function createFileStorage(config: ConfigService): FileStorage {
	if (config.get<string>('STORAGE_DRIVER') === 's3') {
		return new S3FileStorage({
			endpoint: config.get<string>('S3_ENDPOINT') || undefined,
			region: config.get<string>('S3_REGION') ?? 'us-east-1',
			bucket: config.get<string>('S3_BUCKET')!,
			accessKeyId: config.get<string>('S3_ACCESS_KEY')!,
			secretAccessKey: config.get<string>('S3_SECRET_KEY')!,
			forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') !== 'false'
		});
	}
	return new LocalFileStorage(baseDestPath());
}

@Global()
@Module({
	providers: [
		{
			provide: FILE_STORAGE,
			inject: [ConfigService],
			useFactory: createFileStorage
		}
	],
	exports: [FILE_STORAGE]
})
export class StorageModule {}

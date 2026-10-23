import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { FileStorage } from './storage.types';

export interface S3StorageOptions {
	endpoint?: string;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	// MinIO и часть российских провайдеров — только path-style (endpoint/bucket/key)
	forcePathStyle?: boolean;
}

// S3-совместимое хранилище: MinIO, Selectel, Yandex Object Storage, AWS S3
export class S3FileStorage implements FileStorage {
	private readonly client: S3Client;
	private readonly bucket: string;

	constructor(options: S3StorageOptions) {
		this.bucket = options.bucket;
		this.client = new S3Client({
			endpoint: options.endpoint,
			region: options.region,
			forcePathStyle: options.forcePathStyle,
			credentials: {
				accessKeyId: options.accessKeyId,
				secretAccessKey: options.secretAccessKey
			}
		});
	}

	async save(key: string, body: Buffer, contentType?: string): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
				// имена файлов уникальны и не перезаписываются — можно кэшировать надолго
				CacheControl: 'public, max-age=31536000, immutable'
			})
		);
	}

	async delete(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
		);
	}

	async exists(key: string): Promise<boolean> {
		try {
			await this.client.send(
				new HeadObjectCommand({ Bucket: this.bucket, Key: key })
			);
			return true;
		} catch (error) {
			if (
				(error as { $metadata?: { httpStatusCode?: number } }).$metadata
					?.httpStatusCode === 404
			) {
				return false;
			}
			throw error;
		}
	}

	async read(key: string): Promise<Buffer> {
		const result = await this.client.send(
			new GetObjectCommand({ Bucket: this.bucket, Key: key })
		);
		return Buffer.from(await result.Body!.transformToByteArray());
	}
}

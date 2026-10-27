import {
	CreateBucketCommand,
	HeadBucketCommand,
	PutBucketPolicyCommand,
	S3Client
} from '@aws-sdk/client-s3';

// Создать бакет, если его нет; publicRead — анонимное чтение объектов (для S3_PUBLIC_URL)
export async function ensureBucket(
	client: S3Client,
	bucket: string,
	publicRead: boolean
) {
	const exists = await client
		.send(new HeadBucketCommand({ Bucket: bucket }))
		.then(() => true)
		.catch(() => false);
	if (!exists) {
		await client.send(new CreateBucketCommand({ Bucket: bucket }));
	}
	if (publicRead) {
		await client.send(
			new PutBucketPolicyCommand({
				Bucket: bucket,
				Policy: JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Effect: 'Allow',
							Principal: { AWS: ['*'] },
							Action: ['s3:GetObject'],
							Resource: [`arn:aws:s3:::${bucket}/*`]
						}
					]
				})
			})
		);
	}
	return { created: !exists };
}

export function s3ClientFromEnv(env: NodeJS.ProcessEnv = process.env) {
	return new S3Client({
		endpoint: env.S3_ENDPOINT || undefined,
		region: env.S3_REGION ?? 'us-east-1',
		forcePathStyle: env.S3_FORCE_PATH_STYLE !== 'false',
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY ?? '',
			secretAccessKey: env.S3_SECRET_KEY ?? ''
		}
	});
}

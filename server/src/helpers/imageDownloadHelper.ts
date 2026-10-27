import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { contentTypeOf } from 'src/storage/static.middleware';

const DOWNLOAD_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;

const EXTENSION_BY_TYPE: Record<string, string> = {
	'image/png': 'png',
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/gif': 'gif'
};

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9а-яё_-]/gi, '');
}

function fetchImage(
	imageUrl: string,
	redirectsLeft: number
): Promise<{ buffer: Buffer; ext: string }> {
	return new Promise((resolve, reject) => {
		let url: URL;
		try {
			url = new URL(imageUrl);
		} catch {
			reject(new Error(`Невалидный URL: ${imageUrl}`));
			return;
		}
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			reject(new Error(`Неподдерживаемый протокол: ${url.protocol}`));
			return;
		}

		const client = url.protocol === 'https:' ? https : http;
		const request = client.get(url, (response) => {
			const status = response.statusCode ?? 0;

			if (status >= 300 && status < 400 && response.headers.location) {
				response.resume();
				if (redirectsLeft <= 0) {
					reject(new Error(`Слишком много редиректов: ${imageUrl}`));
					return;
				}
				const next = new URL(response.headers.location, url).toString();
				fetchImage(next, redirectsLeft - 1).then(resolve, reject);
				return;
			}

			if (status !== 200) {
				response.resume();
				reject(
					new Error(
						`Не удалось скачать изображение: статус ${status || 'неизвестен'}`
					)
				);
				return;
			}

			const contentType = (response.headers['content-type'] ?? '')
				.split(';')[0]
				.trim();
			const ext =
				EXTENSION_BY_TYPE[contentType] ||
				path.extname(url.pathname).slice(1).toLowerCase() ||
				'jpg';
			if (
				contentType &&
				!contentType.startsWith('image/') &&
				contentType !== 'application/octet-stream'
			) {
				response.resume();
				reject(new Error(`Ответ не является изображением: ${contentType}`));
				return;
			}

			const chunks: Buffer[] = [];
			let size = 0;
			response.on('data', (chunk: Buffer) => {
				size += chunk.length;
				if (size > MAX_IMAGE_BYTES) {
					request.destroy(
						new Error(`Изображение больше ${MAX_IMAGE_BYTES} байт`)
					);
					return;
				}
				chunks.push(chunk);
			});
			response.on('end', () => resolve({ buffer: Buffer.concat(chunks), ext }));
			response.on('error', reject);
		});

		request.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
			request.destroy(new Error(`Таймаут при скачивании изображения: ${imageUrl}`));
		});
		request.on('error', reject);
	});
}

export interface DownloadedImage {
	// имя файла в хранилище: <prefix>-<slug>-<random>.<ext>
	key: string;
	buffer: Buffer;
	contentType: string;
}

// Скачивает изображение по URL; сохранить его — дело вызывающего (FileStorage)
export async function downloadImage(
	imageUrl: string,
	prefix: string,
	name: string
): Promise<DownloadedImage> {
	const { buffer, ext } = await fetchImage(imageUrl, MAX_REDIRECTS);
	const key = `${prefix}-${slugify(name)}-${randomBytes(4).toString('hex')}.${ext}`;
	return { key, buffer, contentType: contentTypeOf(key) };
}

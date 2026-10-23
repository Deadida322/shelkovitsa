import { NextFunction, Request, Response } from 'express';
import * as path from 'path';
import { FileStorage } from './storage.types';

const CONTENT_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif'
};

export function contentTypeOf(key: string): string {
	return CONTENT_TYPES[path.extname(key).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * /static/<ключ> при хранении в S3. С публичным бакетом (publicUrl) — редирект,
 * и трафик картинок не идёт через Node; без него — отдаём файл из бакета сами.
 * Адреса для фронта не меняются: /static/<имя>, как и при локальном хранении.
 */
export function staticFromStorage(storage: FileStorage, publicUrl?: string) {
	const base = publicUrl?.replace(/\/+$/, '');

	return async (req: Request, res: Response, next: NextFunction) => {
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			return next();
		}
		const key = decodeURIComponent(req.path.replace(/^\/+/, ''));
		if (!key || key.includes('/')) {
			return res.status(404).end();
		}

		if (base) {
			return res.redirect(302, `${base}/${encodeURIComponent(key)}`);
		}

		try {
			if (!(await storage.exists(key))) {
				return res.status(404).end();
			}
			res.setHeader('Content-Type', contentTypeOf(key));
			res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
			res.end(req.method === 'HEAD' ? undefined : await storage.read(key));
		} catch (error) {
			next(error);
		}
	};
}

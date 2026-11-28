import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { Logger } from '@nestjs/common';

const routeLogger = new Logger('HTTP');

declare module 'express-serve-static-core' {
	interface Request {
		requestId?: string;
		logStartedAt?: number;
	}
}

/** requestId + опциональный access-лог (IS_LOGGING_ROUTE=true) */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
	const incoming = req.header('x-request-id');
	req.requestId =
		incoming && incoming.length <= 64 ? incoming : randomUUID();
	res.setHeader('x-request-id', req.requestId);
	req.logStartedAt = Date.now();

	if (process.env.IS_LOGGING_ROUTE === 'true') {
		res.on('finish', () => {
			const ms = Date.now() - (req.logStartedAt ?? Date.now());
			const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms rid=${req.requestId}`;
			if (res.statusCode >= 500) {
				routeLogger.error(line);
			} else if (res.statusCode >= 400) {
				routeLogger.warn(line);
			} else {
				routeLogger.log(line);
			}
		});
	}

	next();
}

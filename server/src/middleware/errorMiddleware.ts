import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

// Единый формат ошибок для всего API. Непредвиденные ошибки (TypeORM, TypeError и т.п.)
// логируются со стеком, а клиенту уходит 500 без внутренних подробностей.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger('ExceptionFilter');

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const isHttp = exception instanceof HttpException;
		const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		const stack = exception instanceof Error ? exception.stack : undefined;

		let message: unknown = 'Внутренняя ошибка сервера';
		if (isHttp) {
			const body = exception.getResponse();
			message =
				(typeof body === 'object' &&
					(body as Record<string, unknown>)?.message) ||
				exception.message;
		}

		if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(
				`${request.method} ${request.url}`,
				stack ?? String(exception)
			);
		}

		const payload = {
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			stack: process.env.NODE_ENV === 'development' ? stack : undefined,
			message
		};

		response.status(status).json({
			error: payload
		});
	}
}

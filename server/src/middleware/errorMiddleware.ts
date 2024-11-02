import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status = exception.getStatus();

		const payload = {
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			stack: undefined,
			message: exception.getResponse()['message'] ?? exception.message
		};
		if (process.env.NODE_ENV == 'development') {
			payload.stack = exception.stack;
		}

		response.status(status).json({
			error: payload
		});
	}
}

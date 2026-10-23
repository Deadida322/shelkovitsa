import {
	INestApplication,
	UnprocessableEntityException,
	ValidationPipe
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './middleware/errorMiddleware';
import { errorFormatter } from './helpers/errorHelper';
import { initDiskStorage } from './helpers/storageHelper';

export function parseCorsOrigins(raw?: string): string[] {
	return (raw ?? '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
}

// Общая настройка приложения: используется и в main.ts, и в e2e-тестах
export function configureApp(app: INestApplication) {
	initDiskStorage();
	app.setGlobalPrefix('api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			validationError: {
				target: true
			},
			exceptionFactory: (errors) => {
				const message = errorFormatter(errors);
				return new UnprocessableEntityException(message);
			},
			stopAtFirstError: true
		})
	);
	app.enableCors({
		credentials: true,
		origin: parseCorsOrigins(process.env.CORS)
	});

	app.use(
		helmet({
			crossOriginResourcePolicy: false
		})
	);
	// доверять заголовкам от Nginx
	(app as NestExpressApplication).set('trust proxy', 1);

	app.useGlobalFilters(new HttpExceptionFilter());
	app.use(cookieParser());
	app.enableShutdownHooks();

	return app;
}

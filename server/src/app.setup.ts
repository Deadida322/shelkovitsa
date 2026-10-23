import {
	ClassSerializerInterceptor,
	INestApplication,
	UnprocessableEntityException,
	ValidationPipe
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './middleware/errorMiddleware';
import { errorFormatter } from './helpers/errorHelper';
import { initDiskStorage } from './helpers/storageHelper';
import { ConfigService } from '@nestjs/config';
import { FILE_STORAGE } from './storage/storage.types';
import { staticFromStorage } from './storage/static.middleware';

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

	// Ответы — через DTO из @SerializeOptions({ type }): наружу только поля с @Expose.
	// Сущность без type сериализуется в {} — случайно отданная сущность не утечёт.
	app.useGlobalInterceptors(
		new ClassSerializerInterceptor(app.get(Reflector), {
			excludeExtraneousValues: true,
			exposeUnsetFields: false
		})
	);
	app.useGlobalFilters(new HttpExceptionFilter());
	app.use(cookieParser());

	// Фото в S3: /static/<имя> отдаём из бакета (локально это делает ServeStaticModule)
	const config = app.get(ConfigService);
	if (config.get('STORAGE_DRIVER') === 's3') {
		app.use(
			'/static',
			staticFromStorage(app.get(FILE_STORAGE), config.get('S3_PUBLIC_URL'))
		);
	}
	app.enableShutdownHooks();

	return app;
}

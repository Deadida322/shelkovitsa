import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './middleware/errorMiddleware';
import { errorFormatter } from './helpers/errorHelper';
import { initDiskStorage } from './helpers/storageHelper';
import * as cookieParser from 'cookie-parser';
import { InitService } from './init/init.service';

async function bootstrap() {
	initDiskStorage();

	const app = await NestFactory.create(AppModule, {
		bodyParser: true
	});
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
		// origin: '*'
		origin: process.env.CORS
	});
	app.useGlobalFilters(new HttpExceptionFilter());
	app.use(cookieParser());
	await app.listen(process.env.PORT);

	const initService = app.get(InitService);
	initService.initColors();

	console.log(`App started at http://localhost:${process.env.PORT}`);
}
bootstrap();

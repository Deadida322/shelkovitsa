import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './middleware/errorMiddleware';
import { ValidationError } from 'class-validator';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			validationError: {
				target: true
			}
			// exceptionFactory: (validationErrors: ValidationError[] = []) => {
			// 	return new BadRequestException(validationErrors);
			// }
		})
	);
	app.useGlobalFilters(new HttpExceptionFilter());
	await app.listen(process.env.port);
	console.log(`App started at http://localhost:${process.env.port}`);
}
bootstrap();

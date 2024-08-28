import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './middleware/errorMiddleware';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			validationError: {
				target: true
			}
		})
	);
	app.useGlobalFilters(new HttpExceptionFilter());
	await app.listen(process.env.PORT);

	console.log(`App started at http://localhost:${process.env.PORT}`);
}
bootstrap();

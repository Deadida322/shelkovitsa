import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './middleware/errorMiddleware';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			validationError: {
				target: true
			},
			exceptionFactory: (errors) => {
				const result = errors.map((error) => ({
					property: error.property,
					message: error.constraints[Object.keys(error.constraints)[0]]
				}));
				return new UnprocessableEntityException(result);
			},
			stopAtFirstError: true
		})
	);
	app.useGlobalFilters(new HttpExceptionFilter());
	await app.listen(process.env.PORT);

	console.log(`App started at http://localhost:${process.env.PORT}`);
}
bootstrap();

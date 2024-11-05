import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './middleware/errorMiddleware';
import { errorFormatter } from './helpers/errorHelper';

const message = [
	{
		property: 'deliveryTypeId',
		message: 'deliveryTypeId should not be empty'
	},
	{
		property: 'orderProducts',
		message: 'orderProducts should not be empty'
	}
];
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
			// exceptionFactory: (errors) => {
			// 	const result = errors.map((error) => ({
			// 		property: error.property,
			// 		message: error.constraints[Object.keys(error.constraints)[0]]
			// 	}));
			// 	return new UnprocessableEntityException(result);
			// },
			exceptionFactory: (errors) => {
				const message = errorFormatter(errors);
				return new UnprocessableEntityException(message);
			},
			stopAtFirstError: true
		})
	);
	app.enableCors();
	app.useGlobalFilters(new HttpExceptionFilter());
	await app.listen(process.env.PORT);

	console.log(`App started at http://localhost:${process.env.PORT}`);
}
bootstrap();

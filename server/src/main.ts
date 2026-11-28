import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app.setup';
import { createAppLogger } from './logging/jsonl-logger';

async function bootstrap() {
	const appLogger = createAppLogger();
	const app = await NestFactory.create(AppModule, {
		bodyParser: true,
		logger: appLogger
	});
	configureApp(app);

	// Swagger configuration
	const config = new DocumentBuilder()
		.setTitle('Shelkovitsa API')
		.setDescription('API документация для Shelkovitsa сервера')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'JWT',
				description: 'Enter JWT token',
				in: 'header'
			},
			'JWT-auth'
		)
		.addCookieAuth('access_token', {
			type: 'apiKey',
			in: 'cookie',
			name: 'access_token'
		})
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true
		}
	});

	const port = process.env.PORT ?? 8000;
	await app.listen(port);

	new Logger('Bootstrap').log(`App started at http://localhost:${port}`);
}
bootstrap();

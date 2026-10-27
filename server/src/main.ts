import { NestFactory } from '@nestjs/core';
import { Logger, LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app.setup';

const LOG_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

// LOG_LEVEL=info|log → до log включительно; debug, verbose, warn, error — соответственно
function resolveLogLevels(raw?: string): LogLevel[] {
	const level = (raw === 'info' ? 'log' : raw) as LogLevel;
	const index = LOG_LEVELS.indexOf(level);
	return LOG_LEVELS.slice(0, index === -1 ? LOG_LEVELS.indexOf('log') + 1 : index + 1);
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bodyParser: true,
		logger: resolveLogLevels(process.env.LOG_LEVEL)
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

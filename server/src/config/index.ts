import { ConfigModule } from '@nestjs/config';

export default ConfigModule.forRoot({
	load: [
		() => ({
			PORT: parseInt(process.env.PORT, 10) || 3000,
			DB_HOST: process.env.DB_HOST,
			DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
			DB_USER: process.env.DB_USER,
			DB_PASSWORD: process.env.DB_PASSWORD,
			DB_NAME: process.env.DB_NAME,
			NODE_ENV: process.env.DB_NAME || 'development',
			LOG_LEVEL: process.env.LOG_LEVEL,
			IS_LOGGING_ROUTE: process.env.IS_LOGGING_ROUTE,

			JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
			JWT_PRIVATE_EXP: process.env.JWT_PRIVATE_EXP,
			JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
			JWT_PUBLIC_EXP: process.env.JWT_PUBLIC_EXP,
			PSD_KEY: process.env.PSD_KEY,

			OWNER_ID: process.env.OWNER_ID,

			TEMP_PATH: process.env.TEMP_PATH,
			DEST_PATH: process.env.DEST_PATH,
			CORS: process.env.CORS,
			TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
			ADMIN_TG_ID: process.env.ADMIN_TG_ID
		})
	],
	isGlobal: true
});

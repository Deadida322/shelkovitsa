import { ConfigModule } from '@nestjs/config';

export default ConfigModule.forRoot({
	load: [
		() => ({
			PORT: parseInt(process.env.PORT, 10) || 3000,
			DB_HOST: process.env.DB_HOST,
			DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
			DB_USER: process.env.DB_USER,
			DB_PASSWORD: process.env.DB_PASSWORD
		})
	],
	isGlobal: true
});

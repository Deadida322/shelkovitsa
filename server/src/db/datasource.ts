import { DataSource } from 'typeorm';
import 'dotenv/config';
import { createDataSourceOptions } from './dataSourceOptions';

// Используется TypeORM CLI (migration:generate / migration:run)
const AppDataSource = new DataSource(
	createDataSourceOptions({
		DB_HOST: process.env.DB_HOST,
		DB_PORT: process.env.DB_PORT,
		DB_USER: process.env.DB_USER,
		DB_PASSWORD: process.env.DB_PASSWORD,
		DB_NAME: process.env.DB_NAME
	})
);

export default AppDataSource;

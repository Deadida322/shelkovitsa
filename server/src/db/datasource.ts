import { DataSource } from 'typeorm';
import 'dotenv/config';
import * as path from 'path';

const AppDataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST,
	port: +process.env.DB_PORT,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	entities: [path.join(__dirname, 'entities/**{.ts,.js}')],
	migrations: [path.join(__dirname, 'migrations/**{.ts,.js}')],
	logging: false,
	synchronize: false
});

export default AppDataSource;

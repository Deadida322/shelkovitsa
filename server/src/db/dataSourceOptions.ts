import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { entities } from './entities';
import { migrations } from './migrations';

// В CLI значения берутся прямо из process.env и могут отсутствовать —
// тогда TypeORM сам сообщит об ошибке подключения
interface DbEnv {
	DB_HOST?: string;
	DB_PORT?: number | string;
	DB_USER?: string;
	DB_PASSWORD?: string;
	DB_NAME?: string;
}

// Общие настройки подключения: для приложения (через ConfigService) и для CLI миграций
export function createDataSourceOptions(env: DbEnv): PostgresConnectionOptions {
	return {
		type: 'postgres',
		host: env.DB_HOST,
		port: Number(env.DB_PORT),
		username: env.DB_USER,
		password: env.DB_PASSWORD,
		database: env.DB_NAME,
		entities,
		migrations,
		logging: false,
		synchronize: false
	};
}

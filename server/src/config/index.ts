import { ConfigModule } from '@nestjs/config';
import { plainToInstance, Transform } from 'class-transformer';
import {
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Min,
	validateSync
} from 'class-validator';

const toInt = ({ value }) =>
	value === undefined || value === '' ? undefined : Number(value);

// Переменные окружения, без которых приложение не должно стартовать
export class EnvironmentVariables {
	@IsOptional()
	@IsIn(['development', 'production', 'test'])
	NODE_ENV: string = 'development';

	@Transform(toInt)
	@IsInt()
	@Min(0)
	PORT: number = 8000;

	@IsString()
	@IsNotEmpty()
	DB_HOST: string;

	@Transform(toInt)
	@IsInt()
	DB_PORT: number = 5432;

	@IsString()
	@IsNotEmpty()
	DB_USER: string;

	@IsString()
	DB_PASSWORD: string;

	@IsString()
	@IsNotEmpty()
	DB_NAME: string;

	@IsString()
	@IsNotEmpty()
	JWT_SECRET: string;

	@IsString()
	@IsNotEmpty()
	JWT_EXPIRES_IN: string;

	@IsString()
	@IsNotEmpty()
	TEMP_PATH: string;

	@IsString()
	@IsNotEmpty()
	DEST_PATH: string;

	@IsOptional()
	@IsString()
	CORS?: string;

	@IsOptional()
	@IsIn(['true', 'false'])
	THROTTLE_ENABLED?: string;

	@IsOptional()
	@IsIn(['true', 'false'])
	TELEGRAM_ENABLED?: string;

	@IsOptional()
	@IsString()
	TELEGRAM_TOKEN?: string;

	@IsOptional()
	@IsString()
	ADMIN_TG_ID?: string;

	@IsOptional()
	@IsString()
	CHAT_TG_ID?: string;
}

export function validateEnv(config: Record<string, unknown>) {
	const validated = plainToInstance(EnvironmentVariables, config, {
		exposeDefaultValues: true
	});
	const errors = validateSync(validated, { skipMissingProperties: false });
	if (errors.length) {
		const details = errors
			.map(
				(err) =>
					`  ${err.property}: ${Object.values(err.constraints ?? {}).join(', ')}`
			)
			.join('\n');
		throw new Error(`Некорректная конфигурация окружения:\n${details}`);
	}
	return validated;
}

export default ConfigModule.forRoot({
	validate: validateEnv,
	isGlobal: true
});

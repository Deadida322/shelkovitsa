import { plainToInstance, Transform } from 'class-transformer';
import {
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Min,
	ValidateIf,
	validateSync
} from 'class-validator';

const toInt = ({ value }: { value: unknown }) =>
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

	// Хранилище фото: local — DEST_PATH на диске, s3 — S3-совместимый бакет
	@IsOptional()
	@IsIn(['local', 's3'])
	STORAGE_DRIVER: string = 'local';

	@ValidateIf((env) => env.STORAGE_DRIVER === 's3')
	@IsString()
	@IsNotEmpty()
	S3_BUCKET?: string;

	@ValidateIf((env) => env.STORAGE_DRIVER === 's3')
	@IsString()
	@IsNotEmpty()
	S3_ACCESS_KEY?: string;

	@ValidateIf((env) => env.STORAGE_DRIVER === 's3')
	@IsString()
	@IsNotEmpty()
	S3_SECRET_KEY?: string;

	// для MinIO / Selectel / Yandex; пусто — AWS
	@IsOptional()
	@IsString()
	S3_ENDPOINT?: string;

	@IsOptional()
	@IsString()
	S3_REGION?: string;

	@IsOptional()
	@IsIn(['true', 'false'])
	S3_FORCE_PATH_STYLE?: string;

	// публичный адрес бакета или CDN: /static/<имя> редиректит туда; пусто — отдаём сами
	@IsOptional()
	@IsString()
	S3_PUBLIC_URL?: string;
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

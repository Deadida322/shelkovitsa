import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(private readonly dataSource: DataSource) {}

	@Get()
	@ApiOperation({ summary: 'Проверка работоспособности сервиса и БД' })
	@ApiResponse({ status: 200, description: 'Сервис и БД доступны' })
	@ApiResponse({ status: 503, description: 'БД недоступна' })
	async check() {
		try {
			await this.dataSource.query('SELECT 1');
		} catch {
			throw new ServiceUnavailableException('База данных недоступна');
		}
		return { status: 'ok' };
	}
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BenefitService } from './benefit.service';
import { BenefitDto } from './dto/BenefitDto';

@ApiTags('Benefit')
@Controller('benefit')
export class BenefitController {
	constructor(private readonly benefitService: BenefitService) {}
	@Get()
	@ApiOperation({ summary: 'Получить список преимуществ' })
	@ApiResponse({ status: 200, description: 'Список преимуществ', type: [BenefitDto] })
	async getList(): Promise<BenefitDto[]> {
		return this.benefitService.getList();
	}
}

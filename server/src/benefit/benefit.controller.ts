import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BenefitService } from './benefit.service';
import { BenefitDto } from './dto/BenefitDto';

@ApiTags('Benefit')
@SerializeOptions({ type: BenefitDto })
@Controller('benefit')
export class BenefitController {
	constructor(private readonly benefitService: BenefitService) {}
	@Get()
	@ApiOperation({ summary: 'Получить список преимуществ' })
	@ApiResponse({ status: 200, description: 'Список преимуществ', type: [BenefitDto] })
	async getList() {
		return this.benefitService.getList();
	}
}

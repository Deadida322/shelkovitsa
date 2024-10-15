import { Controller, Get } from '@nestjs/common';
import { BenefitService } from './benefit.service';
import { BenefitDto } from './dto/BenefitDto';

@Controller('benefit')
export class BenefitController {
	constructor(private benefitService: BenefitService) {}
	@Get()
	async getList(): Promise<BenefitDto[]> {
		return this.benefitService.getList();
	}
}

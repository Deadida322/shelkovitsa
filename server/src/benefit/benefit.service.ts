import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Benefit } from 'src/db/entities/Benefit';
import { Repository } from 'typeorm';
import { BenefitDto } from './dto/BenefitDto';
import { convertToJsonMany } from 'src/helpers/convertHelper';
import { baseWhere } from 'src/common/utils';

@Injectable()
export class BenefitService {
	constructor(
		@InjectRepository(Benefit)
		private benefitRepository: Repository<Benefit>
	) {}

	async getList(): Promise<BenefitDto[]> {
		const benefits = await this.benefitRepository.find({
			where: {
				...baseWhere
			}
		});

		return convertToJsonMany(BenefitDto, benefits);
	}
}

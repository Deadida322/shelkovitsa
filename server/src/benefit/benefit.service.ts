import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Benefit } from 'src/db/entities/Benefit';
import { Repository } from 'typeorm';

@Injectable()
export class BenefitService {
	constructor(
		@InjectRepository(Benefit)
		private benefitRepository: Repository<Benefit>
	) {}

	async getList(): Promise<Benefit[]> {
		const benefits = await this.benefitRepository.find({ order: { id: 'ASC' } });

		return benefits;
	}
}

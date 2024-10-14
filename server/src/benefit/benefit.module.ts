import { Module } from '@nestjs/common';
import { BenefitService } from './benefit.service';
import { BenefitController } from './benefit.controller';
import { Benefit } from 'src/db/entities/Benefit';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [TypeOrmModule.forFeature([Benefit])],
	providers: [BenefitService],
	controllers: [BenefitController]
})
export class BenefitModule {}

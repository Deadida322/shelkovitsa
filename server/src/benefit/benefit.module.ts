import { Module } from '@nestjs/common';
import { BenefitService } from './benefit.service';
import { BenefitController } from './benefit.controller';

@Module({
  providers: [BenefitService],
  controllers: [BenefitController]
})
export class BenefitModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { InitService } from './init.service';

@Module({
	imports: [TypeOrmModule.forFeature([ProductColor])],
	providers: [InitService],
	exports: [InitService]
})
export class InitModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';
import { InitService } from './init.service';
import { ProductSize } from 'src/db/entities/ProductSize';

@Module({
	imports: [TypeOrmModule.forFeature([ProductColor, ProductSize])],
	providers: [InitService],
	exports: [InitService]
})
export class InitModule {}

import { Module } from '@nestjs/common';
import { ProductSizeController } from './product-size.controller';
import { ProductSizeService } from './product-size.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSize } from 'src/db/entities/ProductSize';

@Module({
	imports: [TypeOrmModule.forFeature([ProductSize])],
	controllers: [ProductSizeController],
	providers: [ProductSizeService]
})
export class ProductSizeModule {}

import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ConfigModule } from '@nestjs/config';
import { CsvModule } from 'nest-csv-parser';

@Module({
	imports: [TypeOrmModule.forFeature([Product]), ConfigModule, CsvModule],
	controllers: [ProductController],
	providers: [ProductService]
})
export class ProductModule {}

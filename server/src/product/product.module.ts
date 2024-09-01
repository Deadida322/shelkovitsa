import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ConfigModule } from '@nestjs/config';
import { CsvModule } from 'nest-csv-parser';
import { ProductColor } from 'src/db/entities/ProductColor';

@Module({
	imports: [TypeOrmModule.forFeature([Product, ProductColor]), ConfigModule, CsvModule],
	controllers: [ProductController],
	providers: [ProductService]
})
export class ProductModule {}

import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ConfigModule } from '@nestjs/config';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductArticle } from 'src/db/entities/ProductArticle';

@Module({
	imports: [
		TypeOrmModule.forFeature([Product, ProductColor, ProductSize, ProductArticle]),
		ConfigModule
	],
	controllers: [ProductController],
	providers: [ProductService]
})
export class ProductModule {}

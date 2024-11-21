import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Product,
			ProductArticle,
			ProductColor,
			ProductSize,
			ProductSubcategory
		])
	],
	controllers: [ProductController],
	providers: [ProductService]
})
export class ProductModule {}

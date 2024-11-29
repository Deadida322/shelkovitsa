import { Module } from '@nestjs/common';
import { ProductArticleController } from './product-article.controller';
import { ProductArticleService } from './product-article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { Product } from 'src/db/entities/Product';

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
	controllers: [ProductArticleController],
	providers: [ProductArticleService]
})
export class ProductArticleModule {}

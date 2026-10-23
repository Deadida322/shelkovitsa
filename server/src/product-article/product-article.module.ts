import { Module } from '@nestjs/common';
import { ProductArticleController } from './product-article.controller';
import { ProductArticleAdminController } from './product-article-admin.controller';
import { ProductArticleService } from './product-article.service';
import { ProductImportService } from './product-import.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductArticle } from 'src/db/entities/ProductArticle';
import { ProductColor } from 'src/db/entities/ProductColor';
import { ProductSize } from 'src/db/entities/ProductSize';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { Product } from 'src/db/entities/Product';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { ProductFile } from 'src/db/entities/ProductFile';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Product,
			ProductArticle,
			ProductColor,
			ProductSize,
			ProductSubcategory,
			ProductFile
		]),
		NestjsFormDataModule
	],
	controllers: [ProductArticleController, ProductArticleAdminController],
	providers: [ProductArticleService, ProductImportService]
})
export class ProductArticleModule {}

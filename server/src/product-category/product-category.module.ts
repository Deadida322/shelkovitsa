import { Module } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from 'src/db/entities/ProductCategory';
import { ProductSubcategory } from 'src/db/entities/ProductSubcategory';
import { ProductArticle } from 'src/db/entities/ProductArticle';

@Module({
	imports: [
		TypeOrmModule.forFeature([ProductCategory, ProductSubcategory, ProductArticle])
	],
	providers: [ProductCategoryService],
	controllers: [ProductCategoryController]
})
export class ProductCategoryModule {}

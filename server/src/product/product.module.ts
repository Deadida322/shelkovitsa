import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductAdminController } from './product-admin.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/db/entities/Product';

@Module({
	imports: [TypeOrmModule.forFeature([Product])],
	controllers: [ProductController, ProductAdminController],
	providers: [ProductService]
})
export class ProductModule {}

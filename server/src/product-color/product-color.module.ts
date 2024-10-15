import { Module } from '@nestjs/common';
import { ProductColorService } from './product-color.service';
import { ProductColorController } from './product-color.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductColor } from 'src/db/entities/ProductColor';

@Module({
	imports: [TypeOrmModule.forFeature([ProductColor])],
	providers: [ProductColorService],
	controllers: [ProductColorController]
})
export class ProductColorModule {}

import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/index';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModule } from './db/typeOrmModule';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { BenefitModule } from './benefit/benefit.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileModule } from './file/file.module';
import { ProductColorModule } from './product-color/product-color.module';
import { OrderModule } from './order/order.module';
import { DeliveryTypeModule } from './delivery-type/delivery-type.module';
import { ProductArticleModule } from './product-article/product-article.module';
@Module({
	imports: [
		configuration,
		TypeOrmModule,
		JwtModule.register({
			global: true,
			secret: process.env.JWT_PUBLIC_KEY,
			signOptions: { expiresIn: process.env.JWT_PUBLIC_EXP }
		}),
		MulterModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				dest: './temp/src'
			}),
			inject: [ConfigService]
		}),
		ProductModule,
		AuthModule,
		AppModule,
		UserModule,
		BenefitModule,
		ProductCategoryModule,
		FileModule,
		ProductColorModule,
		OrderModule,
		DeliveryTypeModule,
		ProductArticleModule
	]
})
export class AppModule {
	// constructor(private dataSource: DataSource) {}
}

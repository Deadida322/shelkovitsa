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
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { ProductSizeModule } from './product-size/product-size.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TelegrafModule } from 'nestjs-telegraf';
import { InitModule } from './init/init.module';
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
		NestjsFormDataModule.config({
			storage: MemoryStoredFile,
			isGlobal: true
		}),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', 'temp/dist')
		}),
		TelegrafModule.forRoot({
			token: process.env.TELEGRAM_TOKEN
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
		ProductArticleModule,
		ProductSizeModule,
		InitModule
	]
})
export class AppModule {
	// constructor(private dataSource: DataSource) {}
}

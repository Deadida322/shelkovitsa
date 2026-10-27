import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import configuration, { EnvironmentVariables } from './config/index';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { BenefitModule } from './benefit/benefit.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { FileModule } from './file/file.module';
import { ProductColorModule } from './product-color/product-color.module';
import { OrderModule } from './order/order.module';
import { DeliveryTypeModule } from './delivery-type/delivery-type.module';
import { ProductArticleModule } from './product-article/product-article.module';
import { ProductSizeModule } from './product-size/product-size.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { InitModule } from './init/init.module';
import { ScheduleModule } from '@nestjs/schedule';
import { baseDestPath, baseSrcPath } from './helpers/storageHelper';
import { createDataSourceOptions } from './db/dataSourceOptions';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/storage.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

type AppConfigService = ConfigService<EnvironmentVariables, true>;

@Module({
	imports: [
		ScheduleModule.forRoot(),
		configuration,
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: AppConfigService) =>
				createDataSourceOptions({
					DB_HOST: config.get('DB_HOST'),
					DB_PORT: config.get('DB_PORT'),
					DB_USER: config.get('DB_USER'),
					DB_PASSWORD: config.get('DB_PASSWORD'),
					DB_NAME: config.get('DB_NAME')
				})
		}),
		JwtModule.registerAsync({
			global: true,
			inject: [ConfigService],
			useFactory: (config: AppConfigService) => ({
				secret: config.get('JWT_SECRET'),
				signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') }
			})
		}),
		ThrottlerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: AppConfigService) => ({
				// Базовый лимит на IP — только от явного злоупотребления: SSR Nuxt ходит в API
				// с одного адреса за всех посетителей. Строгие лимиты — через @Throttle
				// на auth и создании заказа (эти запросы идут из браузера напрямую).
				throttlers: [{ name: 'default', ttl: 60_000, limit: 1000 }],
				skipIf: () => config.get('THROTTLE_ENABLED', { infer: true }) === 'false'
			})
		}),
		MulterModule.register({
			dest: baseSrcPath()
		}),
		ServeStaticModule.forRootAsync({
			useFactory: () => [
				{
					rootPath: baseDestPath(),
					serveRoot: '/static'
				}
			]
		}),
		ProductModule,
		AuthModule,
		UserModule,
		BenefitModule,
		ProductCategoryModule,
		FileModule,
		ProductColorModule,
		OrderModule,
		DeliveryTypeModule,
		ProductArticleModule,
		ProductSizeModule,
		InitModule,
		HealthModule,
		StorageModule
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		}
	]
})
export class AppModule {}

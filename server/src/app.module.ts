import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import configuration from './config/index';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModule } from './db/typeOrmModule';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { BenefitModule } from './benefit/benefit.module';
import { SizeModule } from './size/size.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { CsvModule } from 'nest-csv-parser';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
				dest: './temp'
			}),
			inject: [ConfigService]
			// storage: diskStorage({
			// 	destination: './temp'
			// })
		}),
		CsvModule,
		ProductModule,
		AuthModule,
		AppModule,
		UserModule,
		BenefitModule,
		SizeModule,
		ProductCategoryModule
	]
})
export class AppModule {
	// constructor(private dataSource: DataSource) {}
}

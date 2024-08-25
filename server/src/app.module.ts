import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import configuration from './config/index';
import AppDataSource from './db/datasource';
import { DataSource } from 'typeorm';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModule } from './db/typeOrmModule';
@Module({
	imports: [configuration, TypeOrmModule, ProductModule, AuthModule, UsersModule]
})
export class AppModule {
	// constructor(private dataSource: DataSource) {}
}

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { UserService } from 'src/user/user.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
	imports: [TypeOrmModule.forFeature([User]), ConfigModule],
	controllers: [AuthController],
	providers: [
		AuthService,
		UserService,
		JwtModule,
		{
			provide: APP_GUARD,
			useClass: AuthGuard
		}
	]
})
export class AuthModule {}

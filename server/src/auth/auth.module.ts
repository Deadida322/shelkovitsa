import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetToken } from 'src/db/entities/PasswordResetToken';
import { User } from 'src/db/entities/User';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { UserModule } from 'src/user/user.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, PasswordResetToken]), UserModule],
	controllers: [AuthController],
	providers: [
		AuthService,
		{
			provide: APP_GUARD,
			useClass: AuthGuard
		}
	]
})
export class AuthModule {}

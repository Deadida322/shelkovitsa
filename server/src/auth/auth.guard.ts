import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_ADMIN_AUTH } from 'src/decorators/adminAuth';
import { IS_AUTH } from 'src/decorators/auth';
import { UserInRequest } from 'src/types/express/custom';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { convertToClass } from 'src/helpers/convertHelper';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
		private readonly configService: ConfigService,
		private readonly userService: UserService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		let isAuth = this.reflector.getAllAndOverride<boolean>(IS_AUTH, [
			context.getHandler(),
			context.getClass()
		]);

		const isAdminAuth = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_AUTH, [
			context.getHandler(),
			context.getClass()
		]);
		if (isAdminAuth) {
			isAuth = true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromCookie(request);

		const ownerId = this.configService.getOrThrow<number>('OWNER_ID');

		if (!ownerId || Number.isInteger(ownerId)) {
			throw new InternalServerErrorException(
				'Неправильно настроена конфигурация администраторской части'
			);
		}

		let payload: UserInRequest;
		if (token) {
			try {
				payload = await this.jwtService.verifyAsync(token, {
					secret: process.env.JWT_PUBLIC_KEY
				});
				const existUser = await this.userService.findOneByMailAndId(
					payload.mail,
					payload.id
				);
				if (!existUser) {
					throw new Error('Нет такого пользователя');
				}
				payload = convertToClass(UserInRequest, existUser);
			} catch (err) {
				if (isAuth || isAdminAuth) {
					throw new UnauthorizedException(err);
				}
			}
		}

		if (payload) {
			request.user = payload;
		}

		if (payload?.id == ownerId) {
			request.isAdmin = true;
		}

		if (!!isAuth && !request.user) {
			throw new UnauthorizedException();
		} else if (!!isAdminAuth && !request.isAdmin) {
			throw new ForbiddenException('У Вас нет доступа!');
		}

		return true;
	}

	private extractTokenFromCookie(request: Request): string | undefined {
		if (!request.cookies.access_token || request.cookies.access_token.length < 5)
			return undefined;
		return String(request?.cookies?.access_token ?? '') ?? undefined;
	}
}

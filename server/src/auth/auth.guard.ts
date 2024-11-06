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

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private reflector: Reflector,
		private configService: ConfigService
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
		const token = this.extractTokenFromHeader(request);

		const ownerId = this.configService.getOrThrow<number>('OWNER_ID');

		if (!ownerId || Number.isInteger(ownerId)) {
			throw new InternalServerErrorException(
				'Неправильно настроена конфигурация администраторской части'
			);
		}

		let payload: UserInRequest;
		if (!!token) {
			try {
				payload = await this.jwtService.verifyAsync(token, {
					secret: process.env.JWT_PUBLIC_KEY
				});
			} catch (err) {
				throw new UnauthorizedException();
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
		} else {
		}

		// if (!!isAdminAuth) {
		// 	try {
		// 		const ownerId = this.configService.getOrThrow<number>('OWNER_ID');
		// 		if (!ownerId || Number.isInteger(ownerId)) {
		// 			throw new InternalServerErrorException(
		// 				'Неправильно настроена конфигурация администраторской части'
		// 			);
		// 		}
		// 		const payload: UserInRequest = await this.jwtService.verifyAsync(token, {
		// 			secret: process.env.JWT_PUBLIC_KEY
		// 		});
		// 		if (payload.id != ownerId) {
		// 			throw new ForbiddenException('У Вас нет доступа!');
		// 		}
		// 		request.user = payload;
		// 	} catch (err) {
		// 		throw new UnauthorizedException();
		// 	}
		// } else if (!!isAuth && !token) {
		// 	throw new UnauthorizedException();
		// } else if (!!token) {
		// 	try {
		// 		const payload: UserInRequest = await this.jwtService.verifyAsync(token, {
		// 			secret: process.env.JWT_PUBLIC_KEY
		// 		});
		// 		request.user = payload;
		// 	} catch {
		// 		if (!!isAuth) {
		// 			throw new UnauthorizedException();
		// 		}
		// 	}
		// }

		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		if (!request.headers.access_token || request.headers.access_token.length < 5)
			return undefined;
		return String(request.headers.access_token ?? '') ?? undefined;
	}
}

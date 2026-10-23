import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_ADMIN_AUTH } from 'src/decorators/adminAuth';
import { IS_AUTH } from 'src/decorators/auth';
import { UserInRequest } from 'src/types/express/custom';
import { UserService } from '../user/user.service';
import { convertToClass } from 'src/helpers/convertHelper';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
		private readonly userService: UserService,
		private readonly authService: AuthService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const targets = [context.getHandler(), context.getClass()];
		const isAdminAuth = !!this.reflector.getAllAndOverride<boolean>(
			IS_ADMIN_AUTH,
			targets
		);
		const isAuth =
			isAdminAuth || !!this.reflector.getAllAndOverride<boolean>(IS_AUTH, targets);

		const request = context.switchToHttp().getRequest<Request>();
		const user = await this.resolveUser(request);

		if (user) {
			request.user = user;
		}

		if (isAuth && !user) {
			throw new UnauthorizedException();
		}
		if (isAdminAuth && !user.isAdmin) {
			throw new ForbiddenException('У Вас нет доступа!');
		}

		return true;
	}

	// Невалидный токен или удалённый пользователь на публичном маршруте — просто гость
	private async resolveUser(request: Request): Promise<UserInRequest | undefined> {
		const token = this.extractTokenFromCookie(request);
		if (!token) {
			return undefined;
		}

		let payload: UserInRequest;
		try {
			payload = await this.jwtService.verifyAsync<UserInRequest>(token);
		} catch {
			return undefined;
		}

		const existUser = await this.userService.findActiveByMailAndId(
			payload.mail,
			payload.id
		);
		if (!existUser) {
			return undefined;
		}

		const user = convertToClass(UserInRequest, existUser);
		user.isAdmin = this.authService.isUserAdmin(user);
		return user;
	}

	private extractTokenFromCookie(request: Request): string | undefined {
		const token = request.cookies?.access_token;
		if (typeof token !== 'string' || token.length < 5) {
			return undefined;
		}
		return token;
	}
}

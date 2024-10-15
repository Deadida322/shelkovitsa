import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_AUTH } from 'src/decorators/auth';
import { UserInRequest } from 'src/types/express/custom';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private reflector: Reflector
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isAuth = this.reflector.getAllAndOverride<boolean>(IS_AUTH, [
			context.getHandler(),
			context.getClass()
		]);

		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (isAuth && !token) {
			throw new UnauthorizedException();
		}
		try {
			const payload: UserInRequest = await this.jwtService.verifyAsync(token, {
				secret: process.env.JWT_PUBLIC_KEY
			});
			request.user = payload;
		} catch {
			throw new UnauthorizedException();
		}
		return true;
	}

	private extractTokenFromHeader(request: Request): string | undefined {
		return String(request.headers.access_token) ?? undefined;
	}
}

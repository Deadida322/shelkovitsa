import type { Mock } from 'vitest';
import {
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AdminAuth } from 'src/decorators/adminAuth';
import { Auth } from 'src/decorators/auth';
import { User, UserRole } from 'src/db/entities/User';
import { UserService } from 'src/user/user.service';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

class Routes {
	open() {}
	@Auth()
	private() {}
	@AdminAuth()
	admin() {}
}

const customer = Object.assign(new User(), {
	id: 2,
	mail: 'u@test.ru',
	fio: 'U',
	password: 'hash',
	role: UserRole.CUSTOMER
});
const admin = Object.assign(new User(), { ...customer, id: 1, role: UserRole.ADMIN });

describe('AuthGuard', () => {
	let guard: AuthGuard;
	let jwt: { verifyAsync: Mock };
	let users: { findActiveByMailAndId: Mock };

	const run = (handler: keyof Routes, cookie?: string) => {
		const request: Record<string, any> = {
			cookies: cookie ? { access_token: cookie } : {}
		};
		const context = {
			getHandler: () => Routes.prototype[handler],
			getClass: () => Routes,
			switchToHttp: () => ({ getRequest: () => request })
		} as unknown as ExecutionContext;
		return guard.canActivate(context).then((result) => ({ result, request }));
	};

	beforeEach(() => {
		jwt = { verifyAsync: vi.fn() };
		users = { findActiveByMailAndId: vi.fn() };
		guard = new AuthGuard(
			jwt as unknown as JwtService,
			new Reflector(),
			users as unknown as UserService,
			new AuthService(users as unknown as UserService, jwt as unknown as JwtService)
		);
	});

	it('публичный маршрут без куки — гость', async () => {
		const { result, request } = await run('open');
		expect(result).toBe(true);
		expect(request.user).toBeUndefined();
	});

	it('битый токен на публичном маршруте — гость, на закрытом — 401', async () => {
		jwt.verifyAsync.mockRejectedValue(new Error('jwt malformed'));
		await expect(run('open', 'broken-token')).resolves.toMatchObject({
			result: true
		});
		await expect(run('private', 'broken-token')).rejects.toThrow(
			UnauthorizedException
		);
	});

	it('удалённый пользователь (findActive не нашёл) — 401', async () => {
		jwt.verifyAsync.mockResolvedValue({ id: 2, mail: customer.mail });
		users.findActiveByMailAndId.mockResolvedValue(null);
		await expect(run('private', 'valid-token')).rejects.toThrow(
			UnauthorizedException
		);
	});

	it('в request.user — только публичные поля и isAdmin', async () => {
		jwt.verifyAsync.mockResolvedValue({ id: 2, mail: customer.mail });
		users.findActiveByMailAndId.mockResolvedValue(customer);
		const { request } = await run('private', 'valid-token');
		expect(request.user).toEqual({
			id: 2,
			mail: customer.mail,
			fio: 'U',
			isAdmin: false
		});
	});

	it('админский маршрут: покупатель — 403, админ — проходит', async () => {
		jwt.verifyAsync.mockResolvedValue({ id: 2, mail: customer.mail });
		users.findActiveByMailAndId.mockResolvedValue(customer);
		await expect(run('admin', 'valid-token')).rejects.toThrow(ForbiddenException);

		users.findActiveByMailAndId.mockResolvedValue(admin);
		await expect(run('admin', 'valid-token')).resolves.toMatchObject({
			result: true
		});
	});

	it('админский маршрут без куки — 401, а не 403', async () => {
		await expect(run('admin')).rejects.toThrow(UnauthorizedException);
	});
});

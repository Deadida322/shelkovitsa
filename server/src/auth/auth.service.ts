import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from 'src/db/entities/User';
import { UserInRequest } from 'src/types/express/custom';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/LoginDto';
import { UserDto } from './dto/UserDto';
import { convertToJson } from 'src/helpers/convertHelper';

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService
	) {}

	async signIn(loginDto: LoginDto) {
		const user = await this.userService.findOneByMailAndPass(
			loginDto.mail,
			loginDto.password
		);
		if (!user) {
			throw new UnauthorizedException('Неправильный логин или пароль');
		}

		if (user.is_deleted) {
			throw new UnauthorizedException('Аккаунт удален!');
		}
		const { access_token } = await this.generateAccess(user);
		return {
			user: convertToJson(UserDto, {
				...user,
				isAdmin: this.isUserAdmin(user)
			}),
			access_token
		};
	}

	async generateAccess(user: User): Promise<{ access_token: string }> {
		const payload: UserInRequest = {
			id: user.id,
			mail: user.mail,
			fio: user.fio
		};
		return {
			access_token: await this.jwtService.signAsync(payload)
		};
	}

	isUserAdmin(user?: Pick<User, 'role'>): boolean {
		return user?.role === UserRole.ADMIN;
	}
}

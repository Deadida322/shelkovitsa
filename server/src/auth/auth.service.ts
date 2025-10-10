import {
	Injectable,
	InternalServerErrorException,
	UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/db/entities/User';
import { UserInRequest } from 'src/types/express/custom';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/LoginDto';
import { UserDto } from './dto/UserDto';
import { convertToJson } from 'src/helpers/convertHelper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
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
		const payload: UserInRequest = {
			id: user.id,
			mail: user.mail,
			fio: user.fio
		};
		const isAdmin = await this.isUserAdmin(payload);
		return {
			user: convertToJson(UserDto, {
				...user,
				isAdmin
			}),
			access_token: await this.jwtService.signAsync(payload)
		};
	}
	async generateAccess(user: User): Promise<{ access_token: string }> {
		const payload: UserInRequest = {
			id: user.id,
			mail: user.mail,
			fio: user.fio
		};
		payload.isAdmin = await this.isUserAdmin(payload);
		return {
			access_token: await this.jwtService.signAsync(payload)
		};
	}
	async isUserAdmin(user?: UserInRequest) {
		const ownerId = this.configService.getOrThrow<number>('OWNER_ID');

		if (!ownerId || Number.isInteger(ownerId)) {
			throw new InternalServerErrorException(
				'Неправильно настроена конфигурация администраторской части'
			);
		}
		return user?.id == ownerId;
	}
}

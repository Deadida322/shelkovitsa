import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiCookieAuth,
	ApiBody
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/RegisterDto';
import { UserDto } from './dto/UserDto';
import { convertToJson } from 'src/helpers/convertHelper';
import { hashPassword } from 'src/helpers/authHelper';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { Response, Request } from 'express';
import { Auth } from 'src/decorators/auth';
import { Throttle } from '@nestjs/throttler';

// Защита от перебора паролей и массовой регистрации
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

interface ICookieOptions {
	secure: boolean;
	httpOnly: boolean;
	sameSite: 'none' | 'lax' | 'strict' | boolean;
	path: string;
}
const cookieOptions: ICookieOptions = {
	secure: process.env.NODE_ENV === 'production',
	httpOnly: true,
	sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	path: '/'
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		private readonly authService: AuthService
	) {}

	@Post('register')
	@Throttle(AUTH_THROTTLE)
	@ApiOperation({ summary: 'Регистрация нового пользователя' })
	@ApiResponse({
		status: 201,
		description: 'Пользователь зарегистрирован',
		type: UserDto
	})
	@ApiResponse({
		status: 400,
		description: 'Ошибка валидации или пользователь уже существует'
	})
	@ApiBody({ type: RegisterDto })
	async register(
		@Body() registerDto: RegisterDto,
		@Res({ passthrough: true }) response: Response
	) {
		if (registerDto.password != registerDto.rePassword) {
			throw new BadRequestException('Пароли не совпадают');
		}
		const existUser = await this.usersRepository.findOne({
			where: {
				mail: registerDto.mail
			}
		});
		if (existUser) {
			throw new BadRequestException('Пользователь с такой почтой уже существует');
		}

		const newUser = await this.usersRepository.save({
			mail: registerDto.mail,
			fio: registerDto.fio,
			password: await hashPassword(registerDto.password)
		});

		const res = convertToJson(UserDto, newUser);

		const { access_token } = await this.authService.generateAccess(newUser);

		response.cookie('access_token', access_token, cookieOptions);

		return res;
	}

	@Post('login')
	@Throttle(AUTH_THROTTLE)
	@ApiOperation({ summary: 'Вход в систему' })
	@ApiResponse({ status: 200, description: 'Успешный вход', type: UserDto })
	@ApiResponse({ status: 401, description: 'Неверные учетные данные' })
	@ApiBody({ type: LoginDto })
	async login(
		@Body() loginDto: LoginDto,
		@Res({ passthrough: true }) response: Response
	): Promise<UserDto> {
		const { access_token, user } = await this.authService.signIn(loginDto);
		response.cookie('access_token', access_token, cookieOptions);
		return user;
	}

	@Get('me')
	@Auth()
	@ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Информация о пользователе', type: UserDto })
	async getMe(@Req() request: Request): Promise<UserDto> {
		return convertToJson(UserDto, request.user);
	}

	@Post('logout')
	@ApiOperation({ summary: 'Выход из системы' })
	@ApiResponse({ status: 201, description: 'Кука авторизации сброшена' })
	logout(@Res({ passthrough: true }) response: Response) {
		response.clearCookie('access_token', cookieOptions);
		return '';
	}
}

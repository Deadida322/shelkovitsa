import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res,
	SerializeOptions
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiCookieAuth,
	ApiBody
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditService } from 'src/audit/audit.service';
import { AuditActions } from 'src/audit/audit.types';
import { User } from 'src/db/entities/User';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/RegisterDto';
import { UserDto } from './dto/UserDto';
import { hashPassword } from 'src/helpers/authHelper';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
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
const cookieSameSite = (): ICookieOptions['sameSite'] => {
	const fromEnv = process.env.COOKIE_SAME_SITE;
	if (fromEnv === 'lax' || fromEnv === 'strict' || fromEnv === 'none') {
		return fromEnv;
	}
	// same-origin фронт + API: lax; none — только если реально кросс-сайт
	return 'lax';
};

const cookieOptions: ICookieOptions = {
	secure: process.env.NODE_ENV === 'production',
	httpOnly: true,
	sameSite: cookieSameSite(),
	path: '/'
};

@ApiTags('Auth')
@SerializeOptions({ type: UserDto })
@Controller('auth')
export class AuthController {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		private readonly authService: AuthService,
		private readonly audit: AuditService
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
			where: { mail: registerDto.mail },
			// почта занята и удалённым аккаунтом (уникальный индекс)
			withDeleted: true
		});
		if (existUser) {
			throw new BadRequestException('Пользователь с такой почтой уже существует');
		}

		const newUser = await this.usersRepository.save({
			mail: registerDto.mail,
			fio: registerDto.fio,
			tel: registerDto.tel,
			password: await hashPassword(registerDto.password)
		});

		const { access_token } = await this.authService.generateAccess(newUser);

		response.cookie('access_token', access_token, cookieOptions);

		this.audit.record({
			actor: { id: newUser.id, mail: newUser.mail },
			action: AuditActions.AUTH_REGISTER,
			entity: 'user',
			entityId: newUser.id,
			meta: { hasTel: Boolean(newUser.tel) }
		});

		return newUser;
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
	) {
		const { access_token, user } = await this.authService.signIn(loginDto);
		response.cookie('access_token', access_token, cookieOptions);
		return user;
	}

	@Get('me')
	@Auth()
	@ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
	@ApiCookieAuth('access_token')
	@ApiResponse({ status: 200, description: 'Информация о пользователе', type: UserDto })
	async getMe(@Req() request: Request) {
		return request.user;
	}

	@Post('logout')
	@ApiOperation({ summary: 'Выход из системы' })
	@ApiResponse({ status: 201, description: 'Кука авторизации сброшена' })
	logout(@Res({ passthrough: true }) response: Response) {
		response.clearCookie('access_token', cookieOptions);
		return '';
	}

	@Post('forgot')
	@Throttle(AUTH_THROTTLE)
	@ApiOperation({ summary: 'Запросить письмо для сброса пароля' })
	@ApiResponse({
		status: 201,
		description: 'Если аккаунт существует — письмо со ссылкой отправлено'
	})
	@ApiBody({ type: ForgotPasswordDto })
	async forgot(@Body() dto: ForgotPasswordDto) {
		await this.authService.requestPasswordReset(dto.mail);
		return { ok: true };
	}

	@Post('reset')
	@Throttle(AUTH_THROTTLE)
	@ApiOperation({ summary: 'Установить новый пароль по токену из письма' })
	@ApiResponse({ status: 201, description: 'Пароль обновлён' })
	@ApiResponse({
		status: 400,
		description: 'Токен недействителен или пароли не совпадают'
	})
	@ApiBody({ type: ResetPasswordDto })
	async reset(@Body() dto: ResetPasswordDto) {
		await this.authService.resetPassword(dto);
		return { ok: true };
	}
}

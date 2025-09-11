import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
	Req,
	Res
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/RegisterDto';
import { UserDto } from './dto/UserDto';
import { convertToJson } from 'src/helpers/convertHelper';
import { encodePsd } from 'src/helpers/authHelper';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { Response, Request } from 'express';
import { Auth } from 'src/decorators/auth';

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

@Controller('auth')
export class AuthController {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		private readonly authService: AuthService
	) {}

	@Post('register')
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
			...registerDto,
			password: encodePsd(registerDto.password)
		});

		const res = convertToJson(UserDto, newUser);

		const { access_token } = await this.authService.generateAccess(newUser);

		response.cookie('access_token', access_token, cookieOptions);

		return res;
	}

	@Post('login')
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
	async getMe(@Req() request: Request): Promise<UserDto> {
		if (request.user) {
			return convertToJson(UserDto, {
				...request.user
			});
		}
		return null;
	}
}

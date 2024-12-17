import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/RegisterDto';
import { UserDto } from './dto/UserDto';
import { convertToJson } from 'src/helpers/convertHelper';
import { encodePsd } from 'src/helpers/authHelper';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { Response } from 'express';

const cookieOptions = {
	secure: false,
	httpOnly: true
};
@Controller('auth')
export class AuthController {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		private authService: AuthService
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
}

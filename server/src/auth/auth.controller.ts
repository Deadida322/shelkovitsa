import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/db/entities/User';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/RegisterDto';
import { UserDto } from './dto/UserDto';
import { classToPlain, plainToClass } from 'class-transformer';
import { convertToClass } from 'src/helpers/convertHelper';
import { encodePsd } from 'src/helpers/authHelper';
import { Public } from 'src/decorators/public';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';

@Controller('auth')
export class AuthController {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		private authService: AuthService
	) {}

	@Public()
	@Post('register')
	async register(@Body() registerDto: RegisterDto): Promise<UserDto> {
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

		const res = convertToClass(UserDto, newUser);

		const { access_token } = await this.authService.generateAccess(newUser);

		res.access_token = access_token;
		return res;
	}

	@Public()
	@Post('login')
	async login(@Body() loginDto: LoginDto): Promise<UserDto> {
		return this.authService.signIn(loginDto);
	}
}

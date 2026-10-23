import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
	@IsNotEmpty()
	@IsEmail()
	mail: string;

	@IsNotEmpty()
	@IsString({
		message: 'Пароль должен быть строкой'
	})
	password: string;
}

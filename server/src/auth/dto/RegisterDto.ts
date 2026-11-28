import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../auth.constants';

export class RegisterDto {
	@IsNotEmpty()
	@IsEmail()
	mail: string;

	@IsNotEmpty()
	@IsString()
	fio: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(MIN_PASSWORD_LENGTH)
	password: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(MIN_PASSWORD_LENGTH)
	rePassword: string;
}

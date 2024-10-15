import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	mail: string;

	@IsString()
	fio: string;

	@IsNotEmpty()
	@IsString()
	password: string;

	@IsNotEmpty()
	@IsString()
	rePassword: string;
}

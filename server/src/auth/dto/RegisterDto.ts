import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class RegisterDto {
	@IsNotEmpty()
	@IsEmail()
	mail: string;

	@IsNotEmpty()
	@IsString()
	fio: string;

	@IsNotEmpty()
	@IsString()
	password: string;

	@IsNotEmpty()
	@IsString()
	rePassword: string;
}

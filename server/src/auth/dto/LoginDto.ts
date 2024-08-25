import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
	@IsEmail()
	mail: string;

	@IsNotEmpty()
	@IsString()
	password: string;
}

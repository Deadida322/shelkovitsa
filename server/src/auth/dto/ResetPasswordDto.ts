import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../auth.constants';

export class ResetPasswordDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	token!: string;

	@ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
	@IsString()
	@MinLength(MIN_PASSWORD_LENGTH)
	password!: string;

	@ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
	@IsString()
	@MinLength(MIN_PASSWORD_LENGTH)
	rePassword!: string;
}

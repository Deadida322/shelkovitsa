import { Expose } from 'class-transformer';
import 'reflect-metadata';
import { TokenDto } from './TokenDto';

export class UserDto extends TokenDto {
	@Expose()
	mail: string;
	@Expose()
	fio: string;
}
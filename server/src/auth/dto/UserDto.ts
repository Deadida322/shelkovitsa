import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class UserDto {
	@Expose()
	mail: string;
	@Expose()
	fio: string;
}

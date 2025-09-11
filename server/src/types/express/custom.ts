import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';

export class UserInRequest {
	@Expose()
	id!: number;
	@Expose()
	mail!: string;
	@Expose()
	fio!: string;
}

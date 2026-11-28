import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class UserInRequest {
	@Expose()
	id!: number;
	@Expose()
	mail!: string;
	@Expose()
	fio!: string;
	@Expose()
	tel?: string | null;
	@Expose()
	isAdmin?: boolean;
}

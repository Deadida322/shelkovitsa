import { Expose, Transform } from 'class-transformer';
import 'reflect-metadata';
import { UserRole } from 'src/db/entities/User';

export class UserDto {
	@Expose()
	mail: string;

	@Expose()
	fio: string;

	// из guard приходит готовый isAdmin, из сущности — вычисляем по роли
	@Expose()
	@Transform(({ obj }) => obj.isAdmin ?? obj.role === UserRole.ADMIN, {
		toClassOnly: true
	})
	isAdmin?: boolean;
}

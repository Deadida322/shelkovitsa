import { Expose, Type } from 'class-transformer';
import 'reflect-metadata';
import { OrderDto } from './OrderDto';
import { UserDto } from 'src/auth/dto/UserDto';

export class OrderAdminDto extends OrderDto {
	@Expose()
	@Type(() => UserDto)
	user!: UserDto;
}

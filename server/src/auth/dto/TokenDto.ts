import { Expose } from 'class-transformer';
import 'reflect-metadata';

export class TokenDto {
	@Expose()
	access_token: string;
}

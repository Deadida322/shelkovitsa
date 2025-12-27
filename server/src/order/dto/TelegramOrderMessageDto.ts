import { Expose } from 'class-transformer';

export class TelegramOrderMessageDto {
	@Expose()
	id!: number;

	@Expose()
	status!: string;

	@Expose()
	errorMessage?: string;
}


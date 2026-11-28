import { Transform } from 'class-transformer';
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsPhoneNumber,
	IsString,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';
import {
	FIO_MAX_LENGTH,
	FIO_MESSAGE,
	FIO_MIN_LENGTH,
	FIO_PATTERN,
	normalizeFio
} from 'src/helpers/fio';
import { normalizeRuPhone } from 'src/helpers/phone';
import { MIN_PASSWORD_LENGTH } from '../auth.constants';

function optionalRuPhone(value: unknown): string | undefined {
	const normalized = normalizeRuPhone(value);
	if (normalized === '' || normalized == null) {
		return undefined;
	}
	return normalized;
}

export class RegisterDto {
	@IsNotEmpty()
	@IsEmail()
	mail: string;

	@Transform(({ value }) => normalizeFio(value))
	@IsNotEmpty({ message: 'Укажите фамилию и имя' })
	@IsString()
	@MinLength(FIO_MIN_LENGTH, { message: FIO_MESSAGE })
	@MaxLength(FIO_MAX_LENGTH, { message: FIO_MESSAGE })
	@Matches(FIO_PATTERN, { message: FIO_MESSAGE })
	fio: string;

	@Transform(({ value }) => optionalRuPhone(value))
	@IsOptional()
	@IsPhoneNumber(undefined, { message: 'Некорректный номер телефона' })
	tel?: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(MIN_PASSWORD_LENGTH)
	password: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(MIN_PASSWORD_LENGTH)
	rePassword: string;
}

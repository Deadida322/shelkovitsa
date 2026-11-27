import { Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import 'reflect-metadata';
import { GetListDto } from 'src/common/dto/GetListDto';
import { OrderStatus } from 'src/db/entities/Order';

const emptyToUndefined = ({ value }: { value: unknown }) =>
	value === '' || value === null || value === undefined ? undefined : value;

export class GetAdminOrderListDto extends GetListDto {
	/** Поиск по ФИО, телефону или почте */
	@Expose()
	@IsOptional()
	@IsString()
	query?: string;

	@Expose()
	@IsOptional()
	@Transform(({ value }) => {
		const next = emptyToUndefined({ value });
		return next === undefined ? undefined : ('' + next).toLowerCase();
	})
	@IsEnum(OrderStatus)
	status?: OrderStatus;

	@Expose()
	@IsOptional()
	@Transform(emptyToUndefined)
	@Type(() => Number)
	@IsInt()
	@Min(1, {
		message: 'Поле должно быть > 0'
	})
	deliveryTypeId?: number;
}

import { Expose } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import 'reflect-metadata';
import { GetListDto } from 'src/common/dto/GetListDto';
import { OrderStatus } from 'src/db/entities/Order';

export const ORDER_LIST_SCOPES = ['active', 'completed'] as const;
export type OrderListScope = (typeof ORDER_LIST_SCOPES)[number];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
	OrderStatus.CREATE,
	OrderStatus.IN_WORK,
	OrderStatus.PAYMENT,
	OrderStatus.DELIVERY
];

export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
	OrderStatus.CLOSE,
	OrderStatus.CANCELLED
];

export class GetCustomerOrderListDto extends GetListDto {
	/** active — текущие; completed — close + cancelled. По умолчанию active. */
	@Expose()
	@IsOptional()
	@IsIn(ORDER_LIST_SCOPES)
	scope?: OrderListScope;
}

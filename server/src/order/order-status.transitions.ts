import { OrderStatus } from 'src/db/entities/Order';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.CREATE]: [OrderStatus.IN_WORK, OrderStatus.CANCELLED],
	[OrderStatus.IN_WORK]: [OrderStatus.PAYMENT, OrderStatus.CANCELLED],
	[OrderStatus.PAYMENT]: [OrderStatus.DELIVERY, OrderStatus.CANCELLED],
	[OrderStatus.DELIVERY]: [OrderStatus.CLOSE, OrderStatus.CANCELLED],
	[OrderStatus.CLOSE]: [],
	[OrderStatus.CANCELLED]: [
		OrderStatus.CREATE,
		OrderStatus.IN_WORK,
		OrderStatus.PAYMENT,
		OrderStatus.DELIVERY
	]
};

export function getNextStatuses(from: OrderStatus): OrderStatus[] {
	return ORDER_STATUS_TRANSITIONS[from] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return getNextStatuses(from).includes(to);
}

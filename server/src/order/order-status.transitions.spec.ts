import { describe, expect, it } from 'vitest';
import { OrderStatus } from 'src/db/entities/Order';
import {
	ORDER_STATUS_TRANSITIONS,
	canTransition,
	getNextStatuses
} from './order-status.transitions';

describe('order-status.transitions', () => {
	it('описывает подтверждённую матрицу переходов', () => {
		expect(ORDER_STATUS_TRANSITIONS).toEqual({
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
		});
	});

	it('разрешает пошаговый путь create → close', () => {
		expect(canTransition(OrderStatus.CREATE, OrderStatus.IN_WORK)).toBe(true);
		expect(canTransition(OrderStatus.IN_WORK, OrderStatus.PAYMENT)).toBe(true);
		expect(canTransition(OrderStatus.PAYMENT, OrderStatus.DELIVERY)).toBe(true);
		expect(canTransition(OrderStatus.DELIVERY, OrderStatus.CLOSE)).toBe(true);
	});

	it('разрешает восстановление из cancelled в рабочие статусы', () => {
		expect(canTransition(OrderStatus.CANCELLED, OrderStatus.CREATE)).toBe(true);
		expect(canTransition(OrderStatus.CANCELLED, OrderStatus.IN_WORK)).toBe(true);
		expect(canTransition(OrderStatus.CANCELLED, OrderStatus.PAYMENT)).toBe(true);
		expect(canTransition(OrderStatus.CANCELLED, OrderStatus.DELIVERY)).toBe(true);
		expect(canTransition(OrderStatus.CANCELLED, OrderStatus.CLOSE)).toBe(false);
		expect(canTransition(OrderStatus.CANCELLED, OrderStatus.CANCELLED)).toBe(false);
	});

	it('запрещает пропуск in_work → delivery; close остаётся терминальным', () => {
		expect(canTransition(OrderStatus.IN_WORK, OrderStatus.DELIVERY)).toBe(false);
		expect(getNextStatuses(OrderStatus.CLOSE)).toEqual([]);
		expect(canTransition(OrderStatus.CLOSE, OrderStatus.CANCELLED)).toBe(false);
	});
});

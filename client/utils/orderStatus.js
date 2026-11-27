export const ORDER_STATUSES = [
    { title: 'Создано', value: 'create' },
    { title: 'В работе', value: 'in_work' },
    { title: 'Оплата', value: 'payment' },
    { title: 'В доставке', value: 'delivery' },
    { title: 'Завершено', value: 'close' },
    { title: 'Отменён', value: 'cancelled' },
];

export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((item) => item.value);

/** @type {Record<string, string[]>} */
export const ORDER_STATUS_TRANSITIONS = {
    create: ['in_work', 'cancelled'],
    in_work: ['payment', 'cancelled'],
    payment: ['delivery', 'cancelled'],
    delivery: ['close', 'cancelled'],
    close: [],
    cancelled: ['create', 'in_work', 'payment', 'delivery'],
};

export function getNextStatuses(from) {
    return ORDER_STATUS_TRANSITIONS[from] ?? [];
}

export function canTransition(from, to) {
    return getNextStatuses(from).includes(to);
}

export function isTerminalStatus(status) {
    return getNextStatuses(status).length === 0;
}

export function getSelectableStatuses(current, statusOptions = ORDER_STATUSES) {
    const allowed = new Set([current, ...getNextStatuses(current)]);
    return statusOptions.filter((item) => allowed.has(item.value));
}

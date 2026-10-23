// Штрихкоды товара: Маркет принимает EAN-13/EAN-8/UPC-A (GTIN), Честный знак строит
// код маркировки на основе GTIN-14. Внутренние коды (префикс 2xx) — не GTIN.

export function normalizeBarcode(value: unknown): string {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.round(value).toString();
	}
	return String(value ?? '').trim();
}

// Excel показал/сохранил число в экспоненциальной записи — цифры потеряны безвозвратно
export function isScientificNotation(value: unknown): boolean {
	return typeof value === 'string' && /^\d+([.,]\d+)?E\+\d+$/i.test(value.trim());
}

export function isValidGtin(code: string): boolean {
	if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) {
		return false;
	}
	const digits = code.split('').map(Number);
	const check = digits.pop()!;
	// веса 3/1 справа налево
	const sum = digits
		.reverse()
		.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
	return (10 - (sum % 10)) % 10 === check;
}

// 200–299 — внутренняя нумерация магазина, для маркетплейсов не годится
export function isInternalBarcode(code: string): boolean {
	return /^2\d{12}$/.test(code) || /^02\d{11}$/.test(code);
}

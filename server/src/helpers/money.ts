/**
 * Деньги в системе — целые копейки (1 ₽ = 100 коп.).
 * Excel/UI вводят рубли; в БД и API — только integer-копейки.
 */

export class MoneyParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MoneyParseError';
	}
}

/** Рубли (строка/число из Excel) → копейки. Дробь — не больше 2 знаков. */
export function rublesToKopecks(raw: unknown): number {
	if (raw === null || raw === undefined || raw === '') {
		throw new MoneyParseError('Цена не указана');
	}

	if (typeof raw === 'number') {
		if (!Number.isFinite(raw)) {
			throw new MoneyParseError('Некорректная цена');
		}
		// Excel часто отдаёт float — округляем до копеек, без хранения дроби в JS
		const kopecks = Math.round(raw * 100);
		if (kopecks <= 0) {
			throw new MoneyParseError('Цена должна быть больше 0');
		}
		return kopecks;
	}

	const normalized = String(raw)
		.trim()
		.replace(/\s/g, '')
		.replace(',', '.');
	if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
		throw new MoneyParseError(
			'Цена должна быть числом в рублях с не более чем 2 знаками после запятой'
		);
	}
	const [whole, frac = ''] = normalized.split('.');
	const kopecks = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
	if (!Number.isSafeInteger(kopecks) || kopecks <= 0) {
		throw new MoneyParseError('Цена должна быть больше 0');
	}
	return kopecks;
}

/** Копейки → строка для отображения «1014,30» (без символа валюты). */
export function formatKopecks(kopecks: number): string {
	const n = Math.trunc(Number(kopecks));
	if (!Number.isFinite(n)) {
		return '';
	}
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	const rubles = Math.floor(abs / 100);
	const rest = String(abs % 100).padStart(2, '0');
	return `${sign}${rubles},${rest}`;
}

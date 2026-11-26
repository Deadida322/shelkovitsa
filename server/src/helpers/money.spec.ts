import { describe, expect, it } from 'vitest';
import { formatKopecks, MoneyParseError, rublesToKopecks } from './money';

describe('rublesToKopecks', () => {
	it('парсит строки с точкой и запятой', () => {
		expect(rublesToKopecks('1014.30')).toBe(101430);
		expect(rublesToKopecks('1014,3')).toBe(101430);
		expect(rublesToKopecks('1500')).toBe(150000);
	});

	it('округляет excel-float до копеек', () => {
		expect(rublesToKopecks(1014.3)).toBe(101430);
		expect(rublesToKopecks(0.1 + 0.2)).toBe(30);
	});

	it('отклоняет ноль, отрицательные и лишние знаки', () => {
		expect(() => rublesToKopecks(0)).toThrow(MoneyParseError);
		expect(() => rublesToKopecks('-1')).toThrow(MoneyParseError);
		expect(() => rublesToKopecks('10.999')).toThrow(MoneyParseError);
		expect(() => rublesToKopecks('abc')).toThrow(MoneyParseError);
	});
});

describe('formatKopecks', () => {
	it('форматирует с двумя знаками', () => {
		expect(formatKopecks(101430)).toBe('1014,30');
		expect(formatKopecks(100)).toBe('1,00');
		expect(formatKopecks(5)).toBe('0,05');
	});
});

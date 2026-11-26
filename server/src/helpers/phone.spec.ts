import { describe, expect, it } from 'vitest';
import { normalizeRuPhone } from './phone';

describe('normalizeRuPhone', () => {
	it('маска и распространённые форматы → E.164', () => {
		expect(normalizeRuPhone('+7 (999) 123-45-67')).toBe('+79991234567');
		expect(normalizeRuPhone('8 (999) 123-45-67')).toBe('+79991234567');
		expect(normalizeRuPhone('79991234567')).toBe('+79991234567');
		expect(normalizeRuPhone('9991234567')).toBe('+79991234567');
	});

	it('пустые значения пропускает', () => {
		expect(normalizeRuPhone('')).toBe('');
		expect(normalizeRuPhone(null)).toBe(null);
	});
});

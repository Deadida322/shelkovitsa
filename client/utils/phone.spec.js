import { describe, expect, it } from 'vitest';
import { normalizeRuPhone } from './phone';

describe('normalizeRuPhone', () => {
    it('маска → E.164', () => {
        expect(normalizeRuPhone('+7 (999) 123-45-67')).toBe('+79991234567');
        expect(normalizeRuPhone('89991234567')).toBe('+79991234567');
    });
});

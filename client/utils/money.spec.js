import { describe, expect, it } from 'vitest';
import {
    formatRub,
    kopecksToRublesInput,
    rublesFilterToKopecks,
    rublesInputToKopecks,
} from './money';

describe('money', () => {
    it('formatRub', () => {
        expect(formatRub(101430)).toBe('1014,30 ₽');
        expect(formatRub(5, { withCurrency: false })).toBe('0,05');
    });

    it('rublesInputToKopecks', () => {
        expect(rublesInputToKopecks('1014,3')).toBe(101430);
        expect(rublesInputToKopecks(1500)).toBe(150000);
        expect(() => rublesInputToKopecks(0)).toThrow();
    });

    it('kopecksToRublesInput / filter', () => {
        expect(kopecksToRublesInput(101430)).toBe('1014.30');
        expect(rublesFilterToKopecks(800)).toBe(80000);
        expect(rublesFilterToKopecks(null)).toBe(null);
    });
});

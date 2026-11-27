import { describe, expect, it } from 'vitest';
import {
    formatRub,
    kopecksToRublesInput,
    rublesFilterToKopecks,
    rublesInputToKopecks,
} from './money';

describe('money', () => {
    it('formatRub', () => {
        expect(formatRub(101430)).toBe('1014,30\u00A0₽');
        expect(formatRub(199000)).toBe('1990,00\u00A0₽');
        expect(formatRub(5, { withCurrency: false })).toBe('0,05');
        // старые рубли в корзине без миграции выглядели бы как копейки
        expect(formatRub(1990)).toBe('19,90\u00A0₽');
    });

    it('rublesInputToKopecks', () => {
        expect(rublesInputToKopecks('1014,3')).toBe(101430);
        expect(rublesInputToKopecks('1990')).toBe(199000);
        expect(rublesInputToKopecks(1500)).toBe(150000);
        expect(() => rublesInputToKopecks(0)).toThrow();
        expect(() => rublesInputToKopecks('10.999')).toThrow();
    });

    it('kopecksToRublesInput / filter', () => {
        expect(kopecksToRublesInput(101430)).toBe('1014.30');
        expect(kopecksToRublesInput(199000)).toBe('1990.00');
        expect(rublesFilterToKopecks(800)).toBe(80000);
        expect(rublesFilterToKopecks(1990)).toBe(199000);
        // UI-фильтр — целые рубли: дробь отбрасывается
        expect(rublesFilterToKopecks(1990.9)).toBe(199000);
        expect(rublesFilterToKopecks(null)).toBe(null);
    });
});

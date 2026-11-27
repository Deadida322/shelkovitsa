/**
 * API и корзина хранят цены в копейках. UI показывает рубли с 2 знаками.
 */

export function formatRub(kopecks, { withCurrency = true } = {}) {
    const n = Math.trunc(Number(kopecks));
    if (!Number.isFinite(n)) {
        // NBSP: «₽» не переносится на следующую строку в узких колонках
        return withCurrency ? '—\u00A0₽' : '—';
    }
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    const rubles = Math.floor(abs / 100);
    const rest = String(abs % 100).padStart(2, '0');
    const amount = `${sign}${rubles},${rest}`;
    return withCurrency ? `${amount}\u00A0₽` : amount;
}

/** Строка/число рублей из инпута админки → копейки */
export function rublesInputToKopecks(raw) {
    if (raw === null || raw === undefined || raw === '') {
        throw new Error('Укажите цену');
    }
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw) || raw <= 0) {
            throw new Error('Цена должна быть больше 0');
        }
        return Math.round(raw * 100);
    }
    const normalized = String(raw).trim().replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
        throw new Error('Цена — число в рублях, не больше 2 знаков после запятой');
    }
    const [whole, frac = ''] = normalized.split('.');
    const kopecks = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
    if (kopecks <= 0) {
        throw new Error('Цена должна быть больше 0');
    }
    return kopecks;
}

/** Копейки → значение для input (1014.30) */
export function kopecksToRublesInput(kopecks) {
    const n = Math.trunc(Number(kopecks));
    if (!Number.isFinite(n)) {
        return '';
    }
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Рубли фильтра каталога → копейки для API */
export function rublesFilterToKopecks(rubles) {
    if (rubles == null || rubles === '') {
        return null;
    }
    const n = Number(rubles);
    if (!Number.isFinite(n)) {
        return null;
    }
    return Math.trunc(n) * 100;
}

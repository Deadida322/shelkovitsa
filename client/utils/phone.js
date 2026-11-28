/**
 * Нормализация российского телефона к E.164 (+7XXXXXXXXXX).
 * UI может держать маску «+7 (999) 123-45-67».
 */
export function normalizeRuPhone(raw) {
    if (raw === null || raw === undefined) {
        return raw;
    }
    const s = String(raw).trim();
    if (!s) {
        return s;
    }
    const digits = s.replace(/\D/g, '');
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        return `+7${digits.slice(1)}`;
    }
    if (digits.length === 10) {
        return `+7${digits}`;
    }
    if (s.startsWith('+') && digits.length >= 11) {
        return `+${digits}`;
    }
    return s;
}

/** E.164 / сырой номер → маска для поля ввода */
export function formatRuPhoneMask(raw) {
    const normalized = normalizeRuPhone(raw);
    if (!normalized || typeof normalized !== 'string') {
        return '';
    }
    const digits = normalized.replace(/\D/g, '');
    if (digits.length !== 11 || !digits.startsWith('7')) {
        return String(raw ?? '');
    }
    const local = digits.slice(1);
    return `+7 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 8)}-${local.slice(8, 10)}`;
}

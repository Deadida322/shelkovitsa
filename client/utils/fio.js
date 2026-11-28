/** Зеркало server/src/helpers/fio.ts — формат ФИО на витрине */
export const FIO_MESSAGE = 'Укажите фамилию и имя буквами (например: Иванова Анна)';

export const FIO_MIN_LENGTH = 5;
export const FIO_MAX_LENGTH = 120;

export const FIO_PATTERN =
    /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'’\-]*(?:[ ]+[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'’\-]*){1,4}$/u;

export function normalizeFio(value) {
    if (typeof value !== 'string') {
        return value;
    }
    return value.trim().replace(/\s+/g, ' ');
}

export function isValidFio(value) {
    if (typeof value !== 'string') {
        return false;
    }
    const v = normalizeFio(value);
    if (v.length < FIO_MIN_LENGTH || v.length > FIO_MAX_LENGTH) {
        return false;
    }
    if (/[\d@_/\\.]/.test(v)) {
        return false;
    }
    return FIO_PATTERN.test(v);
}

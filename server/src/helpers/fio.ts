/** Сообщение для UI и class-validator */
export const FIO_MESSAGE =
	'Укажите фамилию и имя буквами (например: Иванова Анна)';

export const FIO_MIN_LENGTH = 5;
export const FIO_MAX_LENGTH = 120;

/**
 * 2–5 слов: кириллица/латиница, внутри слова дефис или апостроф.
 * Без цифр, @ и прочего мусора.
 */
export const FIO_PATTERN =
	/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'’\-]*(?:[ ]+[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'’\-]*){1,4}$/u;

export function normalizeFio(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	return value.trim().replace(/\s+/g, ' ');
}

export function isValidFio(value: unknown): boolean {
	if (typeof value !== 'string') {
		return false;
	}
	const v = normalizeFio(value) as string;
	if (v.length < FIO_MIN_LENGTH || v.length > FIO_MAX_LENGTH) {
		return false;
	}
	if (/[\d@_/\\.]/.test(v)) {
		return false;
	}
	return FIO_PATTERN.test(v);
}

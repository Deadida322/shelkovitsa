import { FIO_MESSAGE, isValidFio, normalizeFio } from './fio';

describe('fio helper', () => {
	it('нормализует пробелы', () => {
		expect(normalizeFio('  Иванова   Анна  ')).toBe('Иванова Анна');
	});

	it('принимает типичные ФИО', () => {
		expect(isValidFio('Иванова Анна')).toBe(true);
		expect(isValidFio('Иванов Иван Иванович')).toBe(true);
		expect(isValidFio('Анна-Мария Петрова')).toBe(true);
		expect(isValidFio("O'Connor Mary")).toBe(true);
	});

	it('отклоняет ерунду и почту', () => {
		expect(isValidFio('Анна')).toBe(false);
		expect(isValidFio('user@yandex.ru')).toBe(false);
		expect(isValidFio('Иван123 Петров')).toBe(false);
		expect(isValidFio('asdf asdf')).toBe(true); // формально буквы — ок
		expect(isValidFio('')).toBe(false);
		expect(isValidFio('   ')).toBe(false);
	});

	it('сообщение для валидации задано', () => {
		expect(FIO_MESSAGE).toMatch(/фамилию и имя/i);
	});
});

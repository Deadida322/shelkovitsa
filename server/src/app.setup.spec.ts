import { parseCorsOrigins } from './app.setup';

describe('parseCorsOrigins', () => {
	it('разбирает список через запятую с пробелами', () => {
		expect(parseCorsOrigins(' https://a.ru, https://b.ru ,,')).toEqual([
			'https://a.ru',
			'https://b.ru'
		]);
	});

	it('пустое значение — без разрешённых origin', () => {
		expect(parseCorsOrigins(undefined)).toEqual([]);
		expect(parseCorsOrigins('')).toEqual([]);
	});
});

import { ValidationError } from '@nestjs/common';
import { errorFormatter } from './errorHelper';

describe('errorFormatter', () => {
	it('плоский список: последнее сообщение поля, вложенные — через точку', () => {
		const errors: ValidationError[] = [
			{
				property: 'mail',
				constraints: { isNotEmpty: 'пусто', isEmail: 'не email' }
			},
			{
				property: 'orderProducts',
				children: [
					{
						property: '0',
						children: [
							{ property: 'amount', constraints: { isPositive: '> 0' } }
						]
					}
				]
			}
		];

		expect(errorFormatter(errors)).toEqual([
			{ property: 'mail', message: 'не email' },
			{ property: 'orderProducts.0.amount', message: '> 0' }
		]);
	});

	it('ошибка без сообщений — Invalid value', () => {
		expect(errorFormatter([{ property: 'x', constraints: {} }])).toEqual([
			{ property: 'x', message: 'Invalid value' }
		]);
	});
});

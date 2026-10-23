import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UploadProductArticleFileDto } from './dto/UploadProductArticleFileDto';
import { parseAmount } from './product-import.service';

describe('parseAmount — остаток из выгрузки поставщика', () => {
	it.each([
		[7, 7],
		[3.9, 3],
		['12', 12],
		['>5', 5],
		['> 20', 20],
		[' >3 ', 3]
	])('%p → %p', (input, expected) => {
		expect(parseAmount(input)).toBe(expected);
	});

	it.each([[''], [null], [undefined], ['много'], ['>']])('%p → NaN', (input) => {
		expect(parseAmount(input)).toBeNaN();
	});
});

describe('UploadProductArticleFileDto.isDeletedOther', () => {
	const parse = (value: unknown) => {
		const dto = plainToInstance(UploadProductArticleFileDto, {
			isDeletedOther: value
		});
		return { value: dto.isDeletedOther, errors: validateSync(dto) };
	};

	it('строка "false" из multipart — это false (раньше очищала весь каталог)', () => {
		expect(parse('false')).toEqual({ value: false, errors: [] });
	});

	it.each([
		['true', true],
		[true, true],
		[false, false],
		[undefined, false],
		['', false]
	])('%p → %p', (input, expected) => {
		expect(parse(input).value).toBe(expected);
	});

	it('мусор не проходит валидацию', () => {
		expect(parse('yes').errors).toHaveLength(1);
	});
});

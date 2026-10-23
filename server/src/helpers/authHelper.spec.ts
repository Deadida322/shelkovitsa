import { hashPassword, verifyPassword } from './authHelper';

describe('authHelper', () => {
	it('bcrypt-хеш с солью: разные хеши одного пароля, оба проверяются', async () => {
		const [a, b] = await Promise.all([
			hashPassword('secret'),
			hashPassword('secret')
		]);
		expect(a).toMatch(/^\$2[aby]\$10\$/);
		expect(a).not.toBe(b);
		expect(await verifyPassword('secret', a)).toBe(true);
		expect(await verifyPassword('secret', b)).toBe(true);
	});

	it('неверный пароль и пустой хеш не проходят', async () => {
		const hash = await hashPassword('secret');
		expect(await verifyPassword('wrong', hash)).toBe(false);
		expect(await verifyPassword('secret', '')).toBe(false);
	});
});

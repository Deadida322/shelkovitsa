import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto-js';
import { timingSafeEqual } from 'crypto';

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Старый формат: HMAC-SHA256 с общим ключом PSD_KEY, без соли.
// Нужен только чтобы пользователи со старыми хешами могли войти и получить bcrypt-хеш.
function encodeLegacyPsd(password: string): string {
	return crypto.HmacSHA256(password, process.env.PSD_KEY).toString();
}

function isBcryptHash(hash: string): boolean {
	return /^\$2[aby]\$/.test(hash);
}

export async function verifyPassword(
	password: string,
	storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
	if (!storedHash) {
		return { valid: false, needsRehash: false };
	}
	if (isBcryptHash(storedHash)) {
		return { valid: await bcrypt.compare(password, storedHash), needsRehash: false };
	}

	const expected = Buffer.from(storedHash);
	const actual = Buffer.from(encodeLegacyPsd(password));
	const valid = expected.length === actual.length && timingSafeEqual(expected, actual);
	return { valid, needsRehash: valid };
}

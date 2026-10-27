import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
	password: string,
	storedHash: string
): Promise<boolean> {
	if (!storedHash) {
		return false;
	}
	return bcrypt.compare(password, storedHash);
}

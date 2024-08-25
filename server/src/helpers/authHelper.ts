import * as crypto from 'crypto-js';
const secret = process.env.PSD_KEY ?? 'secret';

function encodePsd(password: string): string {
	return crypto.HmacSHA256(password, secret).toString();
}
export { encodePsd };

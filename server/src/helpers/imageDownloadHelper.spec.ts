import * as http from 'http';
import { AddressInfo } from 'net';
import { downloadImage } from './imageDownloadHelper';

describe('downloadImage', () => {
	const png = Buffer.from('89504e470d0a1a0a', 'hex');
	let server: http.Server;
	let base: string;

	beforeAll(async () => {
		server = http.createServer((req, res) => {
			const redirects = /^\/hop\/(\d+)$/.exec(req.url ?? '');
			if (redirects) {
				const left = Number(redirects[1]);
				res.writeHead(302, {
					Location: left ? `/hop/${left - 1}` : '/img.png'
				}).end();
			} else if (req.url === '/img.png') {
				res.writeHead(200, { 'Content-Type': 'image/png' }).end(png);
			} else if (req.url === '/no-type.webp') {
				res.writeHead(200).end(png);
			} else if (req.url === '/page') {
				res.writeHead(200, { 'Content-Type': 'text/html' }).end('<html/>');
			} else {
				res.writeHead(404).end();
			}
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	});

	afterAll(async () => {
		await new Promise((resolve) => server.close(resolve));
	});

	it('возвращает содержимое и ключ с префиксом и slug', async () => {
		const image = await downloadImage(`${base}/img.png`, 'product', 'АРТ 12/3');
		expect(image.key).toMatch(/^product-арт-123-[0-9a-f]{8}\.png$/);
		expect(image.buffer).toEqual(png);
		expect(image.contentType).toBe('image/png');
	});

	it('расширение берётся из URL, если сервер не прислал Content-Type', async () => {
		const image = await downloadImage(`${base}/no-type.webp`, 'color', 'x');
		expect(image.key).toMatch(/\.webp$/);
		expect(image.contentType).toBe('image/webp');
	});

	it('идёт по редиректам, но не больше трёх', async () => {
		await expect(downloadImage(`${base}/hop/2`, 'p', 'x')).resolves.toMatchObject({
			key: expect.stringMatching(/\.png$/)
		});
		await expect(downloadImage(`${base}/hop/5`, 'p', 'x')).rejects.toThrow(
			/редиректов/
		);
	});

	it('отклоняет не-картинки, 404, битые URL и чужие протоколы', async () => {
		await expect(downloadImage(`${base}/page`, 'p', 'x')).rejects.toThrow(
			/не является изображением/
		);
		await expect(downloadImage(`${base}/missing`, 'p', 'x')).rejects.toThrow(/404/);
		await expect(downloadImage('not a url', 'p', 'x')).rejects.toThrow(/Невалидный/);
		await expect(downloadImage('ftp://x/y.png', 'p', 'x')).rejects.toThrow(
			/протокол/
		);
	});
});

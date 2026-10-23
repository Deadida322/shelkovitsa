import * as fs from 'fs';
import * as http from 'http';
import { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';
import { downloadImageToStatic } from './imageDownloadHelper';

describe('downloadImageToStatic', () => {
	const png = Buffer.from('89504e470d0a1a0a', 'hex');
	let server: http.Server;
	let base: string;
	let destDir: string;
	const previousDest = process.env.DEST_PATH;

	beforeAll(async () => {
		destDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelkovitsa-img-'));
		process.env.DEST_PATH = destDir;

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
		fs.rmSync(destDir, { recursive: true, force: true });
		process.env.DEST_PATH = previousDest;
	});

	it('сохраняет картинку в DEST_PATH с префиксом и slug', async () => {
		const name = await downloadImageToStatic(
			`${base}/img.png`,
			'product',
			'АРТ 12/3'
		);
		expect(name).toMatch(/^product-арт-123-[0-9a-f]{8}\.png$/);
		expect(fs.readFileSync(path.join(destDir, name))).toEqual(png);
	});

	it('расширение берётся из URL, если сервер не прислал Content-Type', async () => {
		expect(await downloadImageToStatic(`${base}/no-type.webp`, 'color', 'x')).toMatch(
			/\.webp$/
		);
	});

	it('идёт по редиректам, но не больше трёх', async () => {
		await expect(downloadImageToStatic(`${base}/hop/2`, 'p', 'x')).resolves.toMatch(
			/\.png$/
		);
		await expect(downloadImageToStatic(`${base}/hop/5`, 'p', 'x')).rejects.toThrow(
			/редиректов/
		);
	});

	it('отклоняет не-картинки, 404, битые URL и чужие протоколы', async () => {
		await expect(downloadImageToStatic(`${base}/page`, 'p', 'x')).rejects.toThrow(
			/не является изображением/
		);
		await expect(downloadImageToStatic(`${base}/missing`, 'p', 'x')).rejects.toThrow(
			/404/
		);
		await expect(downloadImageToStatic('not a url', 'p', 'x')).rejects.toThrow(
			/Невалидный/
		);
		await expect(downloadImageToStatic('ftp://x/y.png', 'p', 'x')).rejects.toThrow(
			/протокол/
		);
	});
});

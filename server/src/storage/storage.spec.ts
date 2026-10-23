import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LocalFileStorage } from './local.storage';
import { contentTypeOf, staticFromStorage } from './static.middleware';
import { FileStorage } from './storage.types';

describe('LocalFileStorage', () => {
	let root: string;
	let storage: LocalFileStorage;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), 'shelkovitsa-storage-'));
		storage = new LocalFileStorage(path.join(root, 'nested'));
	});

	afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

	it('сохраняет, читает, проверяет и удаляет файл (каталог создаётся сам)', async () => {
		await storage.save('a.png', Buffer.from('png'));
		expect(await storage.exists('a.png')).toBe(true);
		expect((await storage.read('a.png')).toString()).toBe('png');

		await storage.delete('a.png');
		expect(await storage.exists('a.png')).toBe(false);
		// повторное удаление не падает
		await expect(storage.delete('a.png')).resolves.toBeUndefined();
	});

	it('не выпускает за пределы корня', async () => {
		await expect(storage.save('../evil.png', Buffer.from('x'))).rejects.toThrow(
			/Недопустимое имя/
		);
		await expect(storage.read('sub/../../x')).rejects.toThrow(/Недопустимое имя/);
		expect(fs.existsSync(path.join(root, 'evil.png'))).toBe(false);
	});
});

describe('staticFromStorage', () => {
	const files: Record<string, Buffer> = { 'a.png': Buffer.from('png') };
	const storage: FileStorage = {
		save: vi.fn(),
		delete: vi.fn(),
		exists: async (key) => key in files,
		read: async (key) => files[key]
	};

	function call(middleware: ReturnType<typeof staticFromStorage>, url: string) {
		const res = {
			statusCode: 200,
			headers: {} as Record<string, string>,
			body: undefined as unknown,
			location: undefined as string | undefined,
			status(code: number) {
				this.statusCode = code;
				return this;
			},
			setHeader(key: string, value: string) {
				this.headers[key] = value;
			},
			redirect(code: number, location: string) {
				this.statusCode = code;
				this.location = location;
			},
			end(body?: unknown) {
				this.body = body;
			}
		};
		const next = vi.fn();
		return middleware({ method: 'GET', path: url } as any, res as any, next).then(
			() => ({
				res,
				next
			})
		);
	}

	it('без публичного адреса отдаёт файл из хранилища с типом и кэшем', async () => {
		const { res } = await call(staticFromStorage(storage), '/a.png');
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual(files['a.png']);
		expect(res.headers['Content-Type']).toBe('image/png');
		expect(res.headers['Cache-Control']).toContain('immutable');
	});

	it('с публичным адресом бакета — редирект', async () => {
		const { res } = await call(
			staticFromStorage(storage, 'https://cdn.example.ru/bucket/'),
			'/фото%201.png'
		);
		expect(res.statusCode).toBe(302);
		expect(res.location).toBe(
			`https://cdn.example.ru/bucket/${encodeURIComponent('фото 1.png')}`
		);
	});

	it('нет файла или вложенный путь — 404', async () => {
		expect(
			(await call(staticFromStorage(storage), '/missing.png')).res.statusCode
		).toBe(404);
		expect((await call(staticFromStorage(storage), '/a/b.png')).res.statusCode).toBe(
			404
		);
	});

	it('тип файла по расширению', () => {
		expect(contentTypeOf('x.JPG')).toBe('image/jpeg');
		expect(contentTypeOf('x.webp')).toBe('image/webp');
		expect(contentTypeOf('x.bin')).toBe('application/octet-stream');
	});
});

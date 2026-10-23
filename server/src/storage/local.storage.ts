import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStorage } from './storage.types';

// Файлы на диске сервера (DEST_PATH); раздаёт ServeStaticModule по /static
export class LocalFileStorage implements FileStorage {
	constructor(private readonly root: string) {}

	async save(key: string, body: Buffer): Promise<void> {
		await fs.mkdir(this.root, { recursive: true });
		await fs.writeFile(this.resolve(key), body);
	}

	async delete(key: string): Promise<void> {
		await fs.rm(this.resolve(key), { force: true });
	}

	async exists(key: string): Promise<boolean> {
		return fs
			.stat(this.resolve(key))
			.then(() => true)
			.catch(() => false);
	}

	async read(key: string): Promise<Buffer> {
		return fs.readFile(this.resolve(key));
	}

	// ключ — только имя файла: никаких «../» за пределы корня
	private resolve(key: string): string {
		const file = path.resolve(this.root, key);
		if (path.dirname(file) !== path.resolve(this.root)) {
			throw new Error(`Недопустимое имя файла: ${key}`);
		}
		return file;
	}
}

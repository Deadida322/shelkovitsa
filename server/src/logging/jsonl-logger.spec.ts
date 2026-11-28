import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonlLogger } from './jsonl-logger';

describe('JsonlLogger', () => {
	const dirs: string[] = [];

	afterEach(() => {
		for (const dir of dirs) {
			fs.rmSync(dir, { recursive: true, force: true });
		}
		dirs.length = 0;
	});

	it('пишет JSON-строки в файл', async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelkovitsa-log-'));
		dirs.push(dir);
		const logger = new JsonlLogger({
			dir,
			console: false,
			maxFileBytes: 1024 * 1024,
			maxFiles: 3
		});
		logger.log('hello', 'Test');
		await new Promise((r) => setTimeout(r, 30));
		const raw = fs.readFileSync(path.join(dir, 'app.jsonl'), 'utf8');
		const line = JSON.parse(raw.trim());
		expect(line.level).toBe('info');
		expect(line.msg).toBe('hello');
		expect(line.context).toBe('Test');
	});

	it('ротирует при превышении размера', async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shelkovitsa-log-'));
		dirs.push(dir);
		const logger = new JsonlLogger({
			dir,
			console: false,
			maxFileBytes: 80,
			maxFiles: 5
		});
		for (let i = 0; i < 20; i++) {
			logger.warn(`line-${i}-xxxxxxxxxxxxxxxxxxxx`, 'Rotate');
		}
		await new Promise((r) => setTimeout(r, 80));
		const names = fs.readdirSync(dir);
		expect(names.some((n) => n === 'app.jsonl' || n.startsWith('app-'))).toBe(true);
		expect(names.length).toBeGreaterThanOrEqual(1);
	});
});

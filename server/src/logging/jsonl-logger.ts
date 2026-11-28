import { ConsoleLogger, LogLevel, LoggerService } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';

const NEST_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

function resolveLogLevels(raw?: string): LogLevel[] {
	const level = (raw === 'info' ? 'log' : raw) as LogLevel;
	const index = NEST_LEVELS.indexOf(level);
	return NEST_LEVELS.slice(0, index === -1 ? NEST_LEVELS.indexOf('log') + 1 : index + 1);
}

function levelName(method: string): string {
	if (method === 'log') return 'info';
	return method;
}

export type JsonlLoggerOptions = {
	dir?: string;
	maxFileBytes?: number;
	maxFiles?: number;
	logLevels?: LogLevel[];
	/** дублировать в консоль (по умолчанию да, кроме test без LOG_DIR) */
	console?: boolean;
};

/**
 * Лёгкий JSONL-логгер: stdout (Nest ConsoleLogger) + файл с ротацией по размеру.
 * Без внешних зависимостей. Если dir не задан — только консоль.
 */
export class JsonlLogger implements LoggerService {
	private readonly consoleLogger: ConsoleLogger | null;
	private readonly dir: string | null;
	private readonly maxFileBytes: number;
	private readonly maxFiles: number;
	private readonly fileName = 'app.jsonl';
	private stream: fs.WriteStream | null = null;
	private currentSize = 0;
	private rotating = false;

	constructor(options: JsonlLoggerOptions = {}) {
		const levels = options.logLevels ?? resolveLogLevels(process.env.LOG_LEVEL);
		const wantConsole = options.console ?? process.env.NODE_ENV !== 'test';
		this.consoleLogger = wantConsole
			? new ConsoleLogger('Shelkovitsa', { logLevels: levels })
			: null;
		this.dir = options.dir?.trim() || process.env.LOG_DIR?.trim() || null;
		this.maxFileBytes =
			options.maxFileBytes ??
			Math.max(1, Number(process.env.LOG_MAX_FILE_MB || 50)) * 1024 * 1024;
		this.maxFiles = options.maxFiles ?? Math.max(1, Number(process.env.LOG_MAX_FILES || 7));

		if (this.dir) {
			fs.mkdirSync(this.dir, { recursive: true });
			this.openStream();
		}
	}

	log(message: unknown, ...optionalParams: unknown[]) {
		this.write('log', message, optionalParams);
	}

	error(message: unknown, ...optionalParams: unknown[]) {
		this.write('error', message, optionalParams);
	}

	warn(message: unknown, ...optionalParams: unknown[]) {
		this.write('warn', message, optionalParams);
	}

	debug?(message: unknown, ...optionalParams: unknown[]) {
		this.write('debug', message, optionalParams);
	}

	verbose?(message: unknown, ...optionalParams: unknown[]) {
		this.write('verbose', message, optionalParams);
	}

	fatal?(message: unknown, ...optionalParams: unknown[]) {
		this.write('fatal', message, optionalParams);
	}

	private write(method: LogLevel, message: unknown, optionalParams: unknown[]) {
		const context =
			typeof optionalParams[optionalParams.length - 1] === 'string'
				? (optionalParams[optionalParams.length - 1] as string)
				: undefined;
		const stackOrExtra =
			method === 'error' && optionalParams.length > (context ? 1 : 0)
				? optionalParams[0]
				: undefined;

		if (this.consoleLogger) {
			const fn = this.consoleLogger[method]?.bind(this.consoleLogger);
			if (fn) {
				fn(message as never, ...(optionalParams as never[]));
			}
		}

		if (!this.dir || !this.stream) {
			return;
		}

		const line = JSON.stringify({
			ts: new Date().toISOString(),
			level: levelName(method),
			context: context ?? undefined,
			msg: typeof message === 'string' ? message : safeJson(message),
			...(stackOrExtra != null
				? { detail: typeof stackOrExtra === 'string' ? stackOrExtra : safeJson(stackOrExtra) }
				: {})
		});

		void this.append(`${line}\n`);
	}

	private openStream() {
		if (!this.dir) return;
		const filePath = path.join(this.dir, this.fileName);
		try {
			this.currentSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
		} catch {
			this.currentSize = 0;
		}
		this.stream = fs.createWriteStream(filePath, { flags: 'a' });
	}

	private async append(chunk: string) {
		if (!this.stream || !this.dir) return;
		const bytes = Buffer.byteLength(chunk);
		if (!this.rotating && this.currentSize + bytes > this.maxFileBytes) {
			await this.rotate();
		}
		if (!this.stream) return;
		this.stream.write(chunk);
		this.currentSize += bytes;
	}

	private async rotate() {
		if (!this.dir || this.rotating) return;
		this.rotating = true;
		try {
			const active = path.join(this.dir, this.fileName);
			this.stream?.end();
			this.stream = null;

			if (fs.existsSync(active) && fs.statSync(active).size > 0) {
				const stamp = new Date().toISOString().replace(/[:.]/g, '-');
				const rotated = path.join(this.dir, `app-${stamp}.jsonl`);
				fs.renameSync(active, rotated);
				try {
					const gz = `${rotated}.gz`;
					fs.writeFileSync(gz, gzipSync(fs.readFileSync(rotated)));
					fs.unlinkSync(rotated);
				} catch {
					// если gzip не вышел — оставляем .jsonl
				}
			}

			this.prune();
			this.openStream();
		} finally {
			this.rotating = false;
		}
	}

	private prune() {
		if (!this.dir) return;
		const files = fs
			.readdirSync(this.dir)
			.filter((name) => /^app-.+\.jsonl(\.gz)?$/.test(name))
			.map((name) => {
				const full = path.join(this.dir!, name);
				return { name, full, mtime: fs.statSync(full).mtimeMs };
			})
			.sort((a, b) => b.mtime - a.mtime);

		for (const file of files.slice(this.maxFiles)) {
			try {
				fs.unlinkSync(file.full);
			} catch {
				/* ignore */
			}
		}
	}
}

function safeJson(value: unknown): unknown {
	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return String(value);
	}
}

export function createAppLogger(): JsonlLogger {
	return new JsonlLogger({
		logLevels: resolveLogLevels(process.env.LOG_LEVEL)
	});
}

export { resolveLogLevels };

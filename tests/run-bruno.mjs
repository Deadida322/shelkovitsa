import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bruno');
const extra = process.argv.slice(2);
const result = spawnSync(
	'npx',
	['-y', '@usebruno/cli@4.4.0', 'run', '--env', 'local', ...extra],
	{ cwd, stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);

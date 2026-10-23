import { defineConfig } from 'vitest/config';
import { alias, swcPlugin } from './vitest.config';

// E2E: приложение целиком на тестовой БД shelkovitsa_test.
// Файлы — последовательно: все работают с одной БД и чистят её перед каждым тестом.
export default defineConfig({
	plugins: [swcPlugin],
	resolve: { alias },
	test: {
		globals: true,
		environment: 'node',
		include: ['test/**/*.e2e-spec.ts'],
		setupFiles: ['test/setup-env.ts'],
		globalSetup: ['test/global-setup.ts'],
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000
	}
});

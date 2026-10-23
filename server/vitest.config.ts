import * as path from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC вместо esbuild: Nest DI нужны метаданные декораторов (emitDecoratorMetadata)
export const swcPlugin = swc.vite({
	jsc: {
		parser: { syntax: 'typescript', decorators: true },
		transform: { legacyDecorator: true, decoratorMetadata: true },
		target: 'es2022'
	},
	module: { type: 'es6' }
});

export const alias = { src: path.resolve(__dirname, 'src') };

// Unit-тесты: src/**/*.spec.ts
export default defineConfig({
	plugins: [swcPlugin],
	resolve: { alias },
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts']
	}
});

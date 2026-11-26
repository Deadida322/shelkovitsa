import antfu from '@antfu/eslint-config';
import prettier from 'eslint-plugin-prettier/recommended';

/**
 * Стиль — Prettier (.prettierrc). Antfu stylistic выключен, чтобы не конфликтовать.
 * eslint-plugin-prettier гоняет Prettier как правило ESLint (как на бэке).
 */
export default antfu(
    {
        stylistic: false,
        vue: true,
        typescript: true,
        // jsonc-плагин ломается на eslint 9.27 + текущем antfu; JSON форматирует Prettier
        jsonc: false,
        yaml: false,
        ignores: [
            '.nuxt/**',
            '.output/**',
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '**/*.json',
            '**/*.jsonc',
        ],
    },
    prettier,
    {
        rules: {
            'prettier/prettier': 'error',
            'no-undef': 'off',
            // Nuxt/Vue auto-imports
            'antfu/no-top-level-await': 'off',
            // Nuxt config / Vite plugins — process.env ок
            'node/prefer-global/process': 'off',
        },
    },
);

import antfu from '@antfu/eslint-config';

export default antfu({
    stylistic: {
        semi: true,
        indent: 4, // 4 or 'tab'
        quotes: 'single',
    },
    env: {
        amd: true,
    },
    vue: true,
    rules: {
        // Глобальное переопределение
        'vue/script-indent': ['error', 4, { baseIndent: 1 }],
        'vue/html-indent': ['error', 4, { baseIndent: 1 }],
    },
}, {
    files: ['**/*.vue'],
    rules: {
        'indent': 'off',
        'style/indent': 'off',
        '@stylistic/js/indent': 'off',
        '@stylistic/ts/indent': 'off',
        '@stylistic/js/style-indent': 'off',
        '@stylistic/ts/style-indent': 'off',
        'vue/max-attributes-per-line': ['error', {
            singleline: {
                max: 2,
            },
            multiline: {
                max: 1,
            },
        }],
        'vue/script-indent': ['error', 4, {
            baseIndent: 1,
        }],
    },
}, {
    files: ['*.ts', '*.mts', '*.cts', '*.tsx', '*.vue', '**/*.js'],
    rules: {
        'no-undef': 'off',
        'indent': ['error', 4],
    },
});

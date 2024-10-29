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
}, {
    files: ['**/*.vue'],
    rules: {
        'vue/max-attributes-per-line': ['error', {
            singleline: {
                max: 10,
            },
            multiline: {
                max: 10,
            },
        }],

    },
}, {
    files: ['*.ts', '*.mts', '*.cts', '*.tsx', '*.vue', '**/*.js'],
    rules: {
        'no-undef': 'off',
    },
});

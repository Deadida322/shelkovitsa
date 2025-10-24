// build/plugins/strip-google-fonts.ts
import type { Plugin } from 'vite';

export function stripGoogleFonts(): Plugin {
    return {
        name: 'strip-google-fonts',
        enforce: 'pre', // запускаем как можно раньше
        transform(code, id) {
            // Ловим ЛЮБОЙ CSS, содержащий Google Fonts
            if (
                (id.endsWith('.css') || id.includes('?raw'))
                && code.includes('fonts.googleapis.com')
            ) {
                const cleaned = code.replace(/@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\)[^;]*;?/gi, '');
                if (cleaned !== code) {
                    debugger;
                    console.log('✂️ Удалён Google Fonts из:', id);
                }
                return cleaned;
            }
        },
    };
}

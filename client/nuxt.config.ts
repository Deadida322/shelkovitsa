// https://nuxt.com/docs/api/configuration/nuxt-config
import { fixVuesaxUnwrapElement } from './build/plugins/fix-vuesax-unwrap-element';
import { stripGoogleFonts } from './build/plugins/strip-vuesax-fonts';

export default defineNuxtConfig({
    app: {
        head: {
            link: [
                { rel: 'icon', type: 'image/png', href: '/favs/favicon-96x96.png', sizes: '96x96' },
                { rel: 'icon', type: 'image/svg+xml', href: '/favs/favicon.svg' },
                { rel: 'icon', href: '/favs/favicon.ico' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/favs/apple-touch-icon.png' },
                { rel: 'manifest', href: '/favs/site.webmanifest' },
            ],
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                {
                    name: 'keywords',
                    content:
                        'нижнее белье, купить белье, женское белье, интернет магазин белья, белье оптом, нижнее белье купить, нижнее белье интернет магазин',
                },
                { name: 'author', content: 'Шелковица' },
                { name: 'yandex-verification', content: '' },
                { name: 'google-site-verification', content: '' },
            ],
            title: 'Шелковица - интернет-магазин нижнего белья',
            htmlAttrs: {
                lang: 'ru',
            },
        },
    },
    modules: [
        'vuetify-nuxt-module',
        '@nuxt/eslint',
        '@pinia/nuxt',
        '@vuesax-alpha/nuxt',
        '@nuxt/image',
        '@nuxtjs/google-fonts',
    ],
    devtools: { enabled: false },
    css: ['~/assets/main.scss', 'vuesax-alpha/theme-chalk/index.css'],
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "~/assets/_colors.scss" as *;',
                },
            },
        },
        server: {
            hmr: {
                protocol: 'ws',
                host: 'localhost',
            },
        },
        build: {
            sourcemap: process.env.NODE_ENV === 'production', // или true/false явно
        },
        plugins: [stripGoogleFonts(), fixVuesaxUnwrapElement()],
        ssr: {
            noExternal: ['@vueuse/core', 'vuesax-alpha'], // пакеты, которые нужно обрабатывать Rollup
        },
    },
    nitro: {
        sourceMap: true,
        compressPublicAssets: true,
    },
    hooks: {
        'vite:extendConfig': function (viteInlineConfig) {
            viteInlineConfig.server = {
                ...viteInlineConfig.server,
                hmr: {
                    protocol: 'ws',
                    host: 'localhost',
                },
            };
        },
    },
    runtimeConfig: {
        apiSecret: '', // can be overridden by NUXT_API_SECRET environment variable
        public: {
            apiBase: process.env.BASE_URL || '', // Базовый URL без /api префикса
        },
    },
    routeRules: {
        '/contacts': {
            prerender: true,
        },
        '/deliver': {
            prerender: false,
            ssr: false,
        },
        '/orders': {
            ssr: false,
            headers: { 'cache-control': 'no-cache' },
        },
        '/admin': {
            ssr: false,
            headers: { 'cache-control': 'no-cache' },
        },
        '/signin': {
            ssr: false,
            headers: { 'cache-control': 'no-cache' },
        },
        '/signup': {
            ssr: false,
            headers: { 'cache-control': 'no-cache' },
        },
        '/recover': {
            ssr: false,
            headers: { 'cache-control': 'no-cache' },
        },
    },
    experimental: {
        payloadExtraction: true,
        // CSS в отдельные файлы вместо ~400KB inline в HTML (лучше FCP/LCP)
        inlineSSRStyles: false,
    },
    image: {
        quality: 80,
        format: ['webp'],
        provider: 'static',
    },
    googleFonts: {
        families: {
            'Open Sans': [400, 500, 600],
        },
        // только нужные алфавиты — без greek/math/symbols
        subsets: ['latin', 'cyrillic'],
        display: 'swap',
        download: true,
        inject: true,
        preload: true,
    },
    vuetify: {
        vuetifyOptions: {
            locale: {
                locale: 'ru',
                fallback: 'en',
            },
            localeMessages: ['ru'],
        },
    },
});

/* eslint-disable ts/no-require-imports */
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            link: [
                { rel: 'icon', type: 'image/png', href: './favs/favicon-96x96.png', sizes: '96x96' },
                { rel: 'icon', type: 'image/svg+xml', href: './favs/favicon.svg' },
                { rel: 'icon', href: '/favs/favicon.ico' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: './favs/apple-touch-icon.png' },
                { rel: 'manifest', href: './favs/site.webmanifest' },
            ],
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'keywords', content: 'нижнее белье, купить белье, женское белье, интернет магазин белья, белье оптом, нижнее белье купить, нижнее белье интернет магазин' },
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
    modules: ['vuetify-nuxt-module', '@nuxt/eslint', '@pinia/nuxt'],
    devtools: { enabled: false },
    css: ['~/assets/main.scss'],
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
        // Главная страница с популярными товарами (частое обновление)
        '/': { 
            prerender: true,
            swr: 1800, // Обновление каждые 30 минут
            headers: { 'cache-control': 's-maxage=1800' }
        },
        '/catalog': { 
            prerender: true,
            swr: 1800, // Обновление каждые 30 минут
            headers: { 'cache-control': 's-maxage=1800' }
        },
        '/catalog/**': { 
            prerender: true,
            swr: 3600, // Обновление каждый час
            headers: { 'cache-control': 's-maxage=3600' }
        },
        '/contacts': { 
            prerender: true,
            headers: { 'cache-control': 's-maxage=31536000' }
        },
        '/deliver': { 
            prerender: true,
            swr: 7200, // Обновление каждые 2 часа
            headers: { 'cache-control': 's-maxage=7200' }
        },
        
        // SPA страницы (требуют авторизации)
        '/admin': { 
            ssr: false,
            headers: { 'cache-control': 'no-cache' }
        },
        '/signin': { 
            ssr: false,
            headers: { 'cache-control': 'no-cache' }
        },
        '/signup': { 
            ssr: false,
            headers: { 'cache-control': 'no-cache' }
        },
        '/recover': { 
            ssr: false,
            headers: { 'cache-control': 'no-cache' }
        },
    },
    experimental: {
        payloadExtraction: false,
    },

});

/* eslint-disable ts/no-require-imports */
// Оптимизированная гибридная конфигурация
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
        apiSecret: '',
        public: {
            apiBase: process.env.BASE_URL || 'http://localhost:3000',
        },
    },
    
    // Оптимизированные правила маршрутизации
    routeRules: {
        // Статические страницы (максимальная производительность)
        '/': { 
            prerender: true,
            headers: { 'cache-control': 's-maxage=31536000' }
        },
        '/contacts': { 
            prerender: true,
            headers: { 'cache-control': 's-maxage=31536000' }
        },
        '/deliver': { 
            prerender: true,
            headers: { 'cache-control': 's-maxage=31536000' }
        },
        
        // Каталог с ISR (Incremental Static Regeneration)
        '/catalog': { 
            prerender: true,
            swr: 3600, // Обновление каждые 2 часа
            headers: { 'cache-control': 's-maxage=3600' }
        },
        '/catalog/**': { 
            swr: 1800, // Обновление каждые 30 минут
            headers: { 'cache-control': 's-maxage=1800' }
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

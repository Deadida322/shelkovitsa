/* eslint-disable ts/no-require-imports */
// Конфигурация для полностью статического сайта (SSG)
export default defineNuxtConfig({
    // Включаем статическую генерацию
    nitro: {
        prerender: {
            routes: [
                '/',
                '/catalog',
                '/contacts',
                '/deliver',
                // Добавьте все статические маршруты каталога
                '/catalog/1',
                '/catalog/2',
                // ... другие маршруты
            ]
        }
    },
    
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
    
    // Все страницы статические
    routeRules: {
        // Статические страницы
        '/': { prerender: true },
        '/catalog': { prerender: true },
        '/catalog/**': { prerender: true },
        '/contacts': { prerender: true },
        '/deliver': { prerender: true },
        
        // SPA страницы (требуют авторизации)
        '/admin': { ssr: false },
        '/signin': { ssr: false },
        '/signup': { ssr: false },
        '/recover': { ssr: false },
    },
    
    experimental: {
        payloadExtraction: false,
    },
});

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const api = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',
        async onResponse({ response }) {
            if (response.status === 401) {
                // authStore только здесь — иначе плагин тянет cart до provide $api
                useAuthStore().clearUser();
                // navigateTo вне активного Nuxt-контекста (напр. фоновый fetch корзины) падает
                try {
                    const nuxtApp = tryUseNuxtApp();
                    if (nuxtApp) {
                        await nuxtApp.runWithContext(() => navigateTo('/signin'));
                    }
                } catch {
                    // без контекста — только сброс сессии, редирект на следующей навигации
                }
            }
        },
    });

    return {
        provide: {
            api,
        },
    };
});

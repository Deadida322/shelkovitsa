export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const api = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',
        async onResponse({ response }) {
            if (response.status === 401) {
                // authStore только здесь — иначе плагин тянет cart до provide $api
                useAuthStore().clearUser();
                navigateTo('/signin');
            }
        },
    });

    return {
        provide: {
            api,
        },
    };
});

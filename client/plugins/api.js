export default defineNuxtPlugin(async () => {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();
    const api = $fetch.create({
        baseURL: config.public.apiBase,
        async onResponse({ response }) {
            if (response.status === 401) {
                navigateTo('/signin');
                authStore.clearUser();
            }
        },
    });

    return {
        provide: {
            api,
        },
    };
});

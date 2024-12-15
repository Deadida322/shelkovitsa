export default defineNuxtPlugin(async () => {
    const { useAuthStore } = await import('#imports');
    const authStore = useAuthStore();
    const api = $fetch.create({
        baseURL: 'http://localhost:8000',
        headers: {
            Authorization: `Bearer ${authStore.accessToken}`,
        },
    });

    return {
        provide: {
            api,
        },
    };
});

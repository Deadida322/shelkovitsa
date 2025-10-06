export default defineNuxtRouteMiddleware(async () => {
    const authStore = useAuthStore();
    await authStore.getMe();

    if (!authStore.user && !authStore.user?.isAdmin) {
        return navigateTo('/signin');
    }
});

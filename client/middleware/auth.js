export default defineNuxtRouteMiddleware(async () => {
    const authStore = useAuthStore();
    await authStore.getMe();
    if (!authStore.user) {
        return navigateTo('/signin');
    }
    if (!authStore.user.isAdmin) {
        return navigateTo('/');
    }
});

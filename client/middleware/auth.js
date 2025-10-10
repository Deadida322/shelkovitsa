import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware(() => {
    const authStore = useAuthStore();
    if (!authStore.user && !authStore.user?.isAdmin) {
        return navigateTo('/signin');
    }
});

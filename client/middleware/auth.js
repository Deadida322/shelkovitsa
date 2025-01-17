import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

export default defineNuxtRouteMiddleware(() => {
    if (!authStore.user) {
        return navigateTo('/signin');
    }
});

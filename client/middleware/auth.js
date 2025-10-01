import { useAuthStore } from '@/stores/auth';

const { user } = useAuthStore();

export default defineNuxtRouteMiddleware(() => {
    if (!user && !user?.isAdmin) {
        return navigateTo('/signin');
    }
});

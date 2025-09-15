import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

export default defineNuxtRouteMiddleware(() => {
    authStore.getMe();
});

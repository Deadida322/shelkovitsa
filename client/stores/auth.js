import { useCartStore } from '#imports';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
    const user = useCookie('user');
    const config = useRuntimeConfig();
    // cart не трогаем в setup: api-плагин создаёт auth до provide $api,
    // а cart при init ходил бы в useNuxtApp().$api
    const api = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',
    });

    const login = async (body) => {
        await api('/api/auth/login', { method: 'POST', body }).then((res) => {
            user.value = { ...res };
            if (res.isAdmin) {
                navigateTo({ path: '/admin' });
            } else {
                navigateTo({ path: '/orders' });
                useCartStore().mergeCartWithBackend();
            }
        });
    };

    // Кука user — кэш UI на домене Nuxt; access_token — httpOnly на API-хосте.
    // На SSR (:3000) access_token часто недоступен → /me падает; кэш user не затираем.
    const getMe = async () => {
        try {
            const opts = {};
            if (import.meta.server) {
                const { cookie } = useRequestHeaders(['cookie']);
                if (cookie) {
                    opts.headers = { cookie };
                }
            }
            const res = await api('/api/auth/me', opts);
            user.value = { ...res };
        } catch {
            if (import.meta.client) {
                user.value = null;
            }
        }
    };
    const clearUser = () => {
        user.value = null;
    };

    // access_token — httpOnly-кука, удалить её может только сервер
    const logout = async () => {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
        user.value = null;
        useCartStore().initializeCart();
        await navigateTo('/');
    };

    return {
        user,
        login,
        getMe,
        clearUser,
        logout,
    };
});

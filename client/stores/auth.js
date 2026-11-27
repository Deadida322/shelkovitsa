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

    // Кука user — только подсказка для UI; актуальные данные и права берём с сервера
    const getMe = async () => {
        if (user.value && user.value.fio) {
            await api('/api/auth/me')
                .then((res) => {
                    user.value = { ...res };
                })
                .catch(() => {
                    user.value = null;
                });
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

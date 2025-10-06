import { useCartStore } from '#imports';
import { defineStore } from 'pinia';
import { readonly } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const user = useCookie('user');
    const config = useRuntimeConfig();
    const cart = useCartStore();
    const api = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',
    });

    const login = async (body) => {
        await api('/api/auth/login', { method: 'POST', body }).then((res) => {
            user.value = { ...res };
            if (res.isAdmin) {
                navigateTo({ path: '/admin' });
            }
            else {
                navigateTo({ path: '/deliver' });
                cart.mergeCartWithBackend();
            }
        });
    };

    const getMe = async () => {
        if (user.value && user.value.fio) {
            api('/api/auth/me').then((res) => {
                user.value = { ...res };
            }).catch(() => {
                user.value = null;
            });
        }
    };
    return {
        user: readonly(user),
        login,
        getMe,
    };
});

import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
    const user = useCookie('user');
    const accessToken = useCookie('token');

    const api = $fetch.create({
        baseURL: 'http://localhost:8000',
    });

    const login = (body) => {
        api('/api/auth/login', { method: 'POST', body })
            .then((res) => {
                user.value = { ...res };
                accessToken.value = res.access_token;
                navigateTo({ path: '/deliver' });
            });
    };
    return {
        user,
        accessToken,
        login,
    };
});

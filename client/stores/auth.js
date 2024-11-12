import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
    const user = useCookie('user');
    const accessToken = useCookie('token');

    const { $api } = useNuxtApp();
    const login = (body) => {
        $api('/api/auth/login', { method: 'POST', body })
            .then((res) => {
                user.value = { fio: res.fio, mail: res.mail };
                accessToken.value = res.access_token;
            });
    };
    return {
        user,
        accessToken,
        login,
    };
});

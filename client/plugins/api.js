import { pathnameFromApiRequest, shouldRedirectToSignInOn401 } from '~/utils/apiAuth';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const api = $fetch.create({
        baseURL: config.public.apiBase,
        credentials: 'include',
        async onResponse({ response, options, request }) {
            if (response.status !== 401) {
                return;
            }
            // authStore только здесь — иначе плагин тянет cart до provide $api
            useAuthStore().clearUser();

            if (options.skipAuthRedirect) {
                return;
            }

            const requestPath = pathnameFromApiRequest(request, options);
            try {
                const nuxtApp = tryUseNuxtApp();
                if (!nuxtApp) {
                    return;
                }
                await nuxtApp.runWithContext(() => {
                    const route = useRoute();
                    if (!shouldRedirectToSignInOn401(requestPath, route.path)) {
                        return;
                    }
                    return navigateTo('/signin');
                });
            } catch {
                // без контекста — только сброс сессии, редирект на следующей навигации
            }
        },
    });

    return {
        provide: {
            api,
        },
    };
});
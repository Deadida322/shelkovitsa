export default defineNuxtPlugin(() => {
    onNuxtReady(() => {
        const auth = useAuthStore();

        auth.getMe();
    });
});

export default defineNuxtPlugin(() => {
    onNuxtReady(() => {
        const auth = useAuthStore();
        const cart = useCartStore();
        cart.initializeCart();
        auth.getMe();
    });
});

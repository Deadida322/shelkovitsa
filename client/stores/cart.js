import { ref, useAuthStore, useCookie } from '#imports';

import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', () => {
    const auth = useAuthStore();
    const cartCookie = useCookie('cart', {
        default: () => [],
    });

    const cart = ref([]);
    const { $api } = useNuxtApp();
    const initializeCart = async () => {
        if (auth.user) {
            try {
                const backendCart = await $api('/api/user/basket');
                cart.value = Array.isArray(backendCart) ? backendCart : [];
            }
            catch (error) {
                console.error('Failed to fetch cart from backend:', error);
                cart.value = [];
            }
        }
        else {
            cart.value = Array.isArray(cartCookie.value) ? cartCookie.value : [];
        }
    };

    const syncCart = async () => {
        if (auth.user) {
            try {
                const { $api } = useNuxtApp();
                await $api('/api/user/basket', {
                    method: 'POST',
                    body: cart.value,
                });
            }
            catch (error) {
                console.error('Failed to sync cart with backend:', error);
            }
        }
        else {
            cartCookie.value = cart.value;
        }
    };

    const updateCart = (item) => {
        const idx = cart.value.findIndex(cartItem => cartItem.productId === item.productId);

        if (idx !== -1) {
            cart.value.splice(idx, 1, { ...item, amount: cart.value[idx].amount + item.amount });
        }
        else {
            cart.value.push(item);
        }

        syncCart();
    };

    const removeItem = (idx) => {
        cart.value.splice(idx, 1);
        syncCart();
    };

    const clearCart = () => {
        cart.value = [];
        syncCart();
    };

    const mergeCartWithBackend = async () => {
        if (auth.user && cartCookie.value?.length > 0) {
            try {
                const { $api } = useNuxtApp();
                const backendCart = await $api('/api/user/basket');
                const mergedCart = [...(Array.isArray(backendCart) ? backendCart : [])];

                cartCookie.value.forEach((cookieItem) => {
                    const existsInBackend = mergedCart.some(
                        backendItem => backendItem.productId === cookieItem.productId,
                    );
                    if (!existsInBackend) {
                        mergedCart.push(cookieItem);
                    }
                });

                cart.value = mergedCart;
                await $api('/api/user/basket', {
                    method: 'POST',
                    body: mergedCart,
                });

                cartCookie.value = [];
            }
            catch (error) {
                console.error('Failed to merge cart with backend:', error);
            }
        }
    };

    // Watch for authentication changes
    watch(() => auth.user, (newUser, oldUser) => {
        // If user logged in or out, reinitialize cart
        if ((newUser && !oldUser) || (!newUser && oldUser)) {
            initializeCart();
            if (newUser) {
                mergeCartWithBackend();
            }
        }
    });

    return {
        cart,
        initializeCart,
        updateCart,
        clearCart,
        removeItem,
        mergeCartWithBackend,
    };
});

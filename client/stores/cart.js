import { ref, useAuthStore, useCookie } from '#imports';

import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', () => {
    const auth = useAuthStore();
    // cart_v2: цены в копейках; старая cookie `cart` с рублями сбрасываем
    const cartCookie = useCookie('cart_v2', {
        default: () => [],
    });
    const legacyCartCookie = useCookie('cart');

    const cart = ref([]);
    const isDisabled = ref(false);
    // $api берём внутри методов: store может создаться из api-плагина до provide
    const initializeCart = async () => {
        if (legacyCartCookie.value != null) {
            legacyCartCookie.value = null;
        }
        if (auth.user) {
            try {
                const { $api } = useNuxtApp();
                const backendCart = await $api('/api/user/basket');
                cart.value = Array.isArray(backendCart) ? backendCart : [];
            } catch (error) {
                console.error('Failed to fetch cart from backend:', error);
                cart.value = [];
            }
        } else {
            cart.value = Array.isArray(cartCookie.value) ? cartCookie.value : [];
        }
    };

    const syncCart = async () => {
        if (auth.user) {
            try {
                const { $api } = useNuxtApp();
                await $api('/api/user/basket', {
                    method: 'PUT',
                    body: cart.value,
                });
            } catch (error) {
                console.error('Failed to sync cart with backend:', error);
            }
        } else {
            cartCookie.value = cart.value;
        }
    };

    const updateCart = (item) => {
        const idx = cart.value.findIndex((cartItem) => cartItem.productId === item.productId);

        if (idx !== -1) {
            cart.value.splice(idx, 1, { ...item, amount: cart.value[idx].amount + item.amount });
        } else {
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
                        (backendItem) => backendItem.productId === cookieItem.productId,
                    );
                    if (!existsInBackend) {
                        mergedCart.push(cookieItem);
                    }
                });

                cart.value = mergedCart;
                await $api('/api/user/basket', {
                    method: 'PUT',
                    body: mergedCart,
                });

                cartCookie.value = [];
            } catch (error) {
                console.error('Failed to merge cart with backend:', error);
            }
        }
    };

    return {
        cart,
        initializeCart,
        updateCart,
        clearCart,
        removeItem,
        mergeCartWithBackend,
        isDisabled,
    };
});

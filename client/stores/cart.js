import { defineStore } from 'pinia';
// import { useAuthStore } from './auth';

export const useCartStore = defineStore('cart', () => {
    const cart = useCookie('cart', {
        default: () => [],
    });
    // const auth = useAuthStore();

    // const { $api } = useNuxtApp();
    const updateCart = (item) => {
        const idx = cart.value.findIndex(cartItem => cartItem.productId === item.productId);

        if (idx !== -1) {
            return cart.value.splice(idx, 1, { ...item, amount: cart.value[idx].amount + item.amount });
        }
        cart.value.push(item);
    };

    const removeItem = (idx) => {
        cart.value.splice(idx, 1);
    };

    const clearCart = () => {
        cart.value = [];
    };
    return {
        cart,
        updateCart,
        clearCart,
        removeItem,
    };
});

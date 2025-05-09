import { defineStore } from 'pinia';

export const useOrderStore = defineStore('order', () => {
    const order = ref({});

    const { $api } = useNuxtApp();
    const sendOrder = () => {
        $api('/api/product-category')
            .then((res) => {
                categories.value = res;
            });
    };
    return {
        order,
        sendOrder,
    };
});

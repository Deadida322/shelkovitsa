import { defineStore } from 'pinia';

export const useCategoriesStore = defineStore('categories', () => {
    const categories = ref([]);

    const { $api } = useNuxtApp();
    const getCategories = () => {
        $api('/api/product-category')
            .then((res) => {
                categories.value = res;
            });
    };
    return {
        categories,
        getCategories,
    };
});

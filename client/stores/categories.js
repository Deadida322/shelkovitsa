import { ref, useNuxtApp } from '#imports';
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

    const categoriesMap = computed(() => {
        const res = {};
        categories.value.forEach(({ id, name }) => {
            res[id] = name;
        });
        return res;
    });

    const subcategoriesMap = computed(() => {
        const res = {};
        categories.value.forEach(({ productSubcategories }) => {
            productSubcategories.forEach(({ id, name }) => {
                res[id] = name;
            });
        });
        return res;
    });

    return {
        categories,
        getCategories,
        categoriesMap,
        subcategoriesMap,
    };
});

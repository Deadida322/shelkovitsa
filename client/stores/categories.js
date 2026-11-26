import { computed, ref } from '#imports';
import { defineStore } from 'pinia';

export const useCategoriesStore = defineStore('categories', () => {
    // Публичное меню/каталог — только с опубликованными товарами
    const categories = ref([]);
    // Админка — полный список, включая пустые
    const adminCategories = ref([]);
    // idle | pending | success | error — скелетон меню только на pending
    const status = ref('idle');

    const getCategories = async () => {
        const { $api } = useNuxtApp();
        status.value = 'pending';
        try {
            const res = await $api('/api/product-category');
            categories.value = Array.isArray(res) ? res : [];
            status.value = 'success';
        } catch (error) {
            categories.value = [];
            status.value = 'error';
            throw error;
        }
    };

    const getAdminCategories = async () => {
        const { $api } = useNuxtApp();
        const res = await $api('/api/admin/product-category');
        adminCategories.value = Array.isArray(res) ? res : [];
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
        adminCategories,
        status,
        getCategories,
        getAdminCategories,
        categoriesMap,
        subcategoriesMap,
    };
});

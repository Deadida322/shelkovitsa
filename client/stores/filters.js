import { defineStore } from 'pinia';

export const useFiltersStore = defineStore('filters', () => {
    const filters = ref({});
    const route = useRoute();
    const { category, subcategory } = route.query;

    if (category && subcategory) {
        filters.value = {
            category,
            subcategory,
        };
    }

    const clearFilters = () => {
        filters.value = {};
    };

    return {
        filters,
        clearFilters,
    };
});

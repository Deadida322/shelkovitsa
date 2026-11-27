import { defineStore } from 'pinia';
import { emptyFilters, filtersFromQuery, filtersToQuery } from '~/utils/catalogFilters';

/**
 * Состояние фильтров каталога живёт в Pinia, чтобы при уходе на карточку
 * товара и возврате через меню «Каталог» выбор не терялся.
 * URL — зеркало этого состояния (в т.ч. текст поиска в `q`).
 */
export const useFiltersStore = defineStore('filters', () => {
    const filters = ref(emptyFilters());

    const route = useRoute();
    // первый заход по ссылке с query — подхватываем сразу
    if (Object.keys(route.query).length) {
        applyFromQuery(route.query);
    }

    function applyFromQuery(query = {}) {
        filters.value = filtersFromQuery(query);
    }

    function toQuery() {
        return filtersToQuery(filters.value);
    }

    function resetProductFilters() {
        filters.value.brands = [];
        filters.value.sizes = [];
        filters.value.minPrice = null;
        filters.value.maxPrice = null;
        filters.value.page = 1;
    }

    function setCategory(category, subcategory) {
        filters.value.category = category != null ? String(category) : undefined;
        filters.value.subcategory = subcategory != null ? String(subcategory) : undefined;
        resetProductFilters();
        filters.value.search = '';
        filters.value.sort = 'default';
    }

    function clearFilters() {
        filters.value = emptyFilters();
    }

    return {
        filters,
        applyFromQuery,
        toQuery,
        resetProductFilters,
        setCategory,
        clearFilters,
    };
});

import { defineStore } from 'pinia';

const SORT_IDS = new Set(['default', 'new', 'priceAsc', 'priceDesc']);

const toArray = value => (value == null ? [] : Array.isArray(value) ? value : [value]);
function toInt(value) {
    const number = Number.parseInt(value, 10);
    return Number.isInteger(number) && number >= 0 ? number : null;
}

function emptyFilters() {
    return {
        category: undefined,
        subcategory: undefined,
        search: '',
        brands: [],
        sizes: [],
        minPrice: null,
        maxPrice: null,
        inStock: false,
        sort: 'default',
        page: 1,
    };
}

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
        const next = emptyFilters();
        if (query.category && query.subcategory) {
            next.category = String(query.category);
            next.subcategory = String(query.subcategory);
        }
        next.search = query.q != null ? String(query.q) : '';
        next.brands = toArray(query.brand).map(String);
        next.sizes = toArray(query.size).map(Number).filter(Number.isInteger);
        next.minPrice = toInt(query.minPrice);
        next.maxPrice = toInt(query.maxPrice);
        next.inStock = query.inStock === '1' || query.inStock === 'true';
        next.sort = SORT_IDS.has(query.sort) ? query.sort : 'default';
        next.page = Math.max(1, toInt(query.page) || 1);
        filters.value = next;
    }

    /** Query для router.push / replace — без пустых значений */
    function toQuery() {
        const {
            category,
            subcategory,
            search,
            brands,
            sizes,
            minPrice,
            maxPrice,
            inStock,
            sort,
            page,
        } = filters.value;
        return {
            ...(category && subcategory ? { category: String(category), subcategory: String(subcategory) } : null),
            ...(search.trim() ? { q: search.trim() } : null),
            ...(brands.length ? { brand: brands } : null),
            ...(sizes.length ? { size: sizes.map(String) } : null),
            ...(minPrice != null ? { minPrice: String(minPrice) } : null),
            ...(maxPrice != null ? { maxPrice: String(maxPrice) } : null),
            ...(inStock ? { inStock: '1' } : null),
            ...(sort !== 'default' ? { sort } : null),
            ...(page > 1 ? { page: String(page) } : null),
        };
    }

    function resetProductFilters() {
        filters.value.brands = [];
        filters.value.sizes = [];
        filters.value.minPrice = null;
        filters.value.maxPrice = null;
        filters.value.inStock = false;
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

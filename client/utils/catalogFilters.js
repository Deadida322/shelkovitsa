const SORT_IDS = new Set(['default', 'new', 'priceAsc', 'priceDesc']);

export const toArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

export function toInt(value) {
    const number = Number.parseInt(value, 10);
    return Number.isInteger(number) && number >= 0 ? number : null;
}

export function emptyFilters() {
    return {
        category: undefined,
        subcategory: undefined,
        search: '',
        brands: [],
        sizes: [],
        minPrice: null,
        maxPrice: null,
        sort: 'default',
        page: 1,
    };
}

/** Разбор query → состояние фильтров (без побочных эффектов) */
export function filtersFromQuery(query = {}) {
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
    next.sort = SORT_IDS.has(query.sort) ? query.sort : 'default';
    next.page = Math.max(1, toInt(query.page) || 1);
    return next;
}

/** Состояние → query без пустых значений (для router.push / replace) */
export function filtersToQuery(filters) {
    const { category, subcategory, search, brands, sizes, minPrice, maxPrice, sort, page } =
        filters;
    return {
        ...(category && subcategory
            ? { category: String(category), subcategory: String(subcategory) }
            : null),
        ...(search.trim() ? { q: search.trim() } : null),
        ...(brands.length ? { brand: brands } : null),
        ...(sizes.length ? { size: sizes.map(String) } : null),
        ...(minPrice != null ? { minPrice: String(minPrice) } : null),
        ...(maxPrice != null ? { maxPrice: String(maxPrice) } : null),
        ...(sort !== 'default' ? { sort } : null),
        ...(page > 1 ? { page: String(page) } : null),
    };
}

/**
 * Границы: min ≥ 0, max ≤ productMax (если известен).
 * Если оба заданы и min > max — просто меняем местами (без «стираний»).
 */
export function clampPriceRange(min, max, { productMax = null } = {}) {
    if (min != null) {
        min = Math.max(0, min);
        if (productMax != null) {
            min = Math.min(min, productMax);
        }
    }
    if (max != null) {
        max = Math.max(0, max);
        if (productMax != null) {
            max = Math.min(max, productMax);
        }
    }

    if (min != null && max != null && min > max) {
        return { min: max, max: min };
    }
    return { min, max };
}

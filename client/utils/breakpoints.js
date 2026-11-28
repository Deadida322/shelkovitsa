/**
 * Контракт брейкпоинтов UI (Vuetify 3 defaults).
 * Пары show/hide должны быть комплементарны — без ширины, где нет ни A, ни B.
 */

/** Имена брейкпоинтов Vuetify 3 по возрастанию */
export const DISPLAY_NAMES = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * Пороги Vuetify 3 (min ширины для имени).
 * xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920
 */
export const VUETIFY_MIN_WIDTH = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
};

/** Шапка: compact = гамбургер + сайдбар; wide = пункты меню в навбаре */
const NAV_COMPACT_NAMES = new Set(['xs', 'sm', 'md']);

/**
 * Должен совпадать с `$bp-categories` в `assets/_breakpoints.scss`
 * (сайдбар категорий ↔ кнопка «Категории» / mobile cats).
 */
export const CATEGORIES_BREAKPOINT_PX = 1000;

/** Имя брейкпоинта Vuetify по ширине viewport */
export function vuetifyNameForWidth(width) {
    const w = Number(width);
    if (!Number.isFinite(w) || w < VUETIFY_MIN_WIDTH.sm) return 'xs';
    if (w < VUETIFY_MIN_WIDTH.md) return 'sm';
    if (w < VUETIFY_MIN_WIDTH.lg) return 'md';
    if (w < VUETIFY_MIN_WIDTH.xl) return 'lg';
    return 'xl';
}

/** Флаги шапки: ровно один режим на любом имени */
export function navFlagsForBreakpoint(name) {
    const isNavCompact = NAV_COMPACT_NAMES.has(name);
    return {
        isNavCompact,
        isNavWide: !isNavCompact,
    };
}

export function navFlagsForWidth(width) {
    return navFlagsForBreakpoint(vuetifyNameForWidth(width));
}

/**
 * Категории: сайдбар (layout) и мобильная панель (catalog) —
 * на любой ширине виден ровно один вариант.
 */
export function categoriesUiForWidth(width) {
    const mobile = Number(width) <= CATEGORIES_BREAKPOINT_PX;
    return {
        showSidebar: !mobile,
        showMobileCategories: mobile,
    };
}

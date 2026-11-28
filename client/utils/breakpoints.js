/**
 * Контракт брейкпоинтов UI.
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

/**
 * Общий compact-порог layout:
 * - шапка: меню ↔ гамбургер
 * - каталог: сайдбар категорий ↔ кнопка «Категории»
 * Держать в синхроне с `$bp-categories` в `assets/_breakpoints.scss`.
 */
export const COMPACT_LAYOUT_PX = 1000;

export const CATEGORIES_BREAKPOINT_PX = COMPACT_LAYOUT_PX;
export const NAV_BREAKPOINT_PX = COMPACT_LAYOUT_PX;

/** Имя брейкпоинта Vuetify по ширине viewport */
export function vuetifyNameForWidth(width) {
    const w = Number(width);
    if (!Number.isFinite(w) || w < VUETIFY_MIN_WIDTH.sm) return 'xs';
    if (w < VUETIFY_MIN_WIDTH.md) return 'sm';
    if (w < VUETIFY_MIN_WIDTH.lg) return 'md';
    if (w < VUETIFY_MIN_WIDTH.xl) return 'lg';
    return 'xl';
}

/** Флаги шапки по ширине: ровно один режим */
export function navFlagsForWidth(width) {
    const isNavCompact = Number(width) <= NAV_BREAKPOINT_PX;
    return {
        isNavCompact,
        isNavWide: !isNavCompact,
    };
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

import { computed, reactive } from 'vue';
import { useDisplay } from 'vuetify';
import { navFlagsForBreakpoint } from '~/utils/breakpoints';

/**
 * Единые границы Vuetify 3:
 * xs <600 | sm 600–959 | md 960–1279 | lg 1280–1919 | xl ≥1920
 *
 * Пары без дыр (см. utils/breakpoints.js + spec):
 * - isNavCompact / isNavWide — шапка, порог 1280
 * - категории — CSS `$bp-categories` (1000), сайдбар ↔ mobile cats
 */
export default function useBreakpoints() {
    const display = useDisplay();

    const navFlags = computed(() => navFlagsForBreakpoint(display.name.value));

    return reactive({
        isSmallMobile: computed(() => display.xs.value), // < 600
        isMobile: computed(() => display.sm.value), // 600–959
        isTablet: computed(() => display.md.value), // 960–1279
        isLaptop: computed(() => display.lg.value), // 1280–1919
        isDesktop: computed(() => display.xl.value), // ≥ 1920

        /** Шапка: свёрнутый центр + гамбургер (< 1280) */
        isNavCompact: computed(() => navFlags.value.isNavCompact),
        /** Шапка: пункты меню + Войти/Выйти в навбаре (≥ 1280) */
        isNavWide: computed(() => navFlags.value.isNavWide),

        active: computed(() => display.name.value),
        width: display.width,
        height: display.height,
    });
}

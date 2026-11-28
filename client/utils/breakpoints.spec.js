import { describe, expect, it } from 'vitest';
import {
    CATEGORIES_BREAKPOINT_PX,
    COMPACT_LAYOUT_PX,
    DISPLAY_NAMES,
    NAV_BREAKPOINT_PX,
    VUETIFY_MIN_WIDTH,
    categoriesUiForWidth,
    navFlagsForWidth,
    vuetifyNameForWidth,
} from './breakpoints.js';

describe('vuetifyNameForWidth', () => {
    it('мапит границы Vuetify 3 без пропусков', () => {
        expect(vuetifyNameForWidth(0)).toBe('xs');
        expect(vuetifyNameForWidth(599)).toBe('xs');
        expect(vuetifyNameForWidth(600)).toBe('sm');
        expect(vuetifyNameForWidth(959)).toBe('sm');
        expect(vuetifyNameForWidth(960)).toBe('md');
        expect(vuetifyNameForWidth(1279)).toBe('md');
        expect(vuetifyNameForWidth(1280)).toBe('lg');
        expect(vuetifyNameForWidth(1919)).toBe('lg');
        expect(vuetifyNameForWidth(1920)).toBe('xl');
    });

    it('покрывает каждый именованный диапазон', () => {
        for (const name of DISPLAY_NAMES) {
            expect(vuetifyNameForWidth(VUETIFY_MIN_WIDTH[name])).toBe(name);
        }
    });
});

describe('navFlags — меню ↔ гамбургер', () => {
    it('шапка и категории делят один порог', () => {
        expect(NAV_BREAKPOINT_PX).toBe(COMPACT_LAYOUT_PX);
        expect(CATEGORIES_BREAKPOINT_PX).toBe(COMPACT_LAYOUT_PX);
        expect(COMPACT_LAYOUT_PX).toBe(1000);
    });

    it('на любой ширине ровно один режим', () => {
        const samples = [320, 600, 999, 1000, 1001, 1200, 1280, 1920];
        for (const width of samples) {
            const { isNavCompact, isNavWide } = navFlagsForWidth(width);
            expect(isNavCompact).toBe(!isNavWide);
            expect(isNavCompact || isNavWide).toBe(true);
        }
    });

    it('граница 1000px: слева гамбургер, справа десктоп-меню', () => {
        expect(navFlagsForWidth(1000)).toEqual({ isNavCompact: true, isNavWide: false });
        expect(navFlagsForWidth(1001)).toEqual({ isNavCompact: false, isNavWide: true });
    });

    it('в диапазоне 1001–1279 меню остаётся (раньше рано уходило в бургер)', () => {
        for (const width of [1001, 1100, 1200, 1279]) {
            const flags = navFlagsForWidth(width);
            expect(flags.isNavWide, `width=${width}`).toBe(true);
            expect(flags.isNavCompact, `width=${width}`).toBe(false);
        }
    });
});

describe('categoriesUi — сайдбар ↔ мобильные категории', () => {
    it('токен совпадает с SCSS $bp-categories', () => {
        expect(CATEGORIES_BREAKPOINT_PX).toBe(1000);
    });

    it('на любой ширине ровно один вариант', () => {
        const samples = [320, 600, 999, 1000, 1001, 1200, 1920];
        for (const width of samples) {
            const ui = categoriesUiForWidth(width);
            expect(ui.showSidebar).toBe(!ui.showMobileCategories);
            expect(ui.showSidebar || ui.showMobileCategories).toBe(true);
        }
    });

    it('граница 1000px без разрыва', () => {
        expect(categoriesUiForWidth(1000)).toEqual({
            showSidebar: false,
            showMobileCategories: true,
        });
        expect(categoriesUiForWidth(1001)).toEqual({
            showSidebar: true,
            showMobileCategories: false,
        });
    });
});

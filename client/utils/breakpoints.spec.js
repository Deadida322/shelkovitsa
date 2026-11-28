import { describe, expect, it } from 'vitest';
import {
    CATEGORIES_BREAKPOINT_PX,
    DISPLAY_NAMES,
    VUETIFY_MIN_WIDTH,
    categoriesUiForWidth,
    navFlagsForBreakpoint,
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
    it('на каждом имени ровно один режим (нет дыры и нет двойного UI)', () => {
        for (const name of DISPLAY_NAMES) {
            const { isNavCompact, isNavWide } = navFlagsForBreakpoint(name);
            expect(isNavCompact).toBe(!isNavWide);
            expect(isNavCompact || isNavWide).toBe(true);
        }
    });

    it('compact до lg, wide с lg', () => {
        expect(navFlagsForBreakpoint('xs')).toEqual({ isNavCompact: true, isNavWide: false });
        expect(navFlagsForBreakpoint('sm')).toEqual({ isNavCompact: true, isNavWide: false });
        expect(navFlagsForBreakpoint('md')).toEqual({ isNavCompact: true, isNavWide: false });
        expect(navFlagsForBreakpoint('lg')).toEqual({ isNavCompact: false, isNavWide: true });
        expect(navFlagsForBreakpoint('xl')).toEqual({ isNavCompact: false, isNavWide: true });
    });

    it('граница 1280px: слева гамбургер, справа десктоп-меню', () => {
        expect(navFlagsForWidth(1279).isNavCompact).toBe(true);
        expect(navFlagsForWidth(1279).isNavWide).toBe(false);
        expect(navFlagsForWidth(1280).isNavCompact).toBe(false);
        expect(navFlagsForWidth(1280).isNavWide).toBe(true);
    });

    it('бывшая дыра 600–1280 закрыта (compact + не wide)', () => {
        for (const width of [600, 800, 959, 960, 1000, 1200, 1279]) {
            const flags = navFlagsForWidth(width);
            expect(flags.isNavCompact, `width=${width}`).toBe(true);
            expect(flags.isNavWide, `width=${width}`).toBe(false);
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

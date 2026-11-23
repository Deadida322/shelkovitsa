import { describe, expect, it } from 'vitest';
import {
    clampPriceRange,
    emptyFilters,
    filtersFromQuery,
    filtersToQuery,
    toInt,
} from './catalogFilters.js';

describe('toInt', () => {
    it('парсит неотрицательные целые', () => {
        expect(toInt('0')).toBe(0);
        expect(toInt('700')).toBe(700);
        expect(toInt(42)).toBe(42);
    });

    it('отбрасывает мусор и отрицательные', () => {
        expect(toInt('')).toBeNull();
        expect(toInt('abc')).toBeNull();
        expect(toInt('-1')).toBeNull();
        expect(toInt(null)).toBeNull();
    });
});

describe('filtersFromQuery / filtersToQuery', () => {
    it('круг: query → state → query сохраняет поиск и фильтры', () => {
        const query = {
            q: 'трусы',
            brand: ['Janira', 'Mia Amore'],
            size: ['4', '5'],
            minPrice: '700',
            maxPrice: '2000',
            inStock: '1',
            sort: 'priceAsc',
            page: '2',
            category: '1',
            subcategory: '3',
        };
        const state = filtersFromQuery(query);
        expect(state.search).toBe('трусы');
        expect(state.brands).toEqual(['Janira', 'Mia Amore']);
        expect(state.sizes).toEqual([4, 5]);
        expect(state.minPrice).toBe(700);
        expect(state.maxPrice).toBe(2000);
        expect(state.inStock).toBe(true);
        expect(state.sort).toBe('priceAsc');
        expect(state.page).toBe(2);
        expect(state.category).toBe('1');
        expect(state.subcategory).toBe('3');

        expect(filtersToQuery(state)).toEqual({
            q: 'трусы',
            brand: ['Janira', 'Mia Amore'],
            size: ['4', '5'],
            minPrice: '700',
            maxPrice: '2000',
            inStock: '1',
            sort: 'priceAsc',
            page: '2',
            category: '1',
            subcategory: '3',
        });
    });

    it('пустые значения не попадают в query', () => {
        expect(filtersToQuery(emptyFilters())).toEqual({});
    });

    it('одиночный brand/size из query становится массивом', () => {
        const state = filtersFromQuery({ brand: 'Janira', size: '4' });
        expect(state.brands).toEqual(['Janira']);
        expect(state.sizes).toEqual([4]);
    });

    it('невалидный sort сбрасывается в default', () => {
        expect(filtersFromQuery({ sort: 'weird' }).sort).toBe('default');
    });
});

describe('clampPriceRange', () => {
    const productMax = 5166;

    it('клампит min к [0, productMax−1] и max к [1, productMax]', () => {
        expect(clampPriceRange(-10, 99999, { productMax })).toEqual({
            min: 0,
            max: 5166,
        });
        expect(clampPriceRange(6000, 1, { productMax, side: 'min' })).toEqual({
            min: 5165,
            max: null,
        });
    });

    it('уход с max при min > max стирает min', () => {
        expect(clampPriceRange(700, 200, { productMax, side: 'max' })).toEqual({
            min: null,
            max: 200,
        });
    });

    it('уход с min при min > max стирает max', () => {
        expect(clampPriceRange(700, 200, { productMax, side: 'min' })).toEqual({
            min: 700,
            max: null,
        });
    });

    it('равные min и max не считаются конфликтом', () => {
        expect(clampPriceRange(500, 500, { productMax, side: 'max' })).toEqual({
            min: 500,
            max: 500,
        });
    });

    it('без productMax только конфликтная логика', () => {
        expect(clampPriceRange(900, 100, { side: 'max' })).toEqual({
            min: null,
            max: 100,
        });
        expect(clampPriceRange(50, null, {})).toEqual({ min: 50, max: null });
    });

    it('max ниже 1 поднимается до 1', () => {
        expect(clampPriceRange(null, 0, { productMax })).toEqual({
            min: null,
            max: 1,
        });
    });
});

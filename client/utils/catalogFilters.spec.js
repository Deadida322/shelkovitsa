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

    it('клампит к [0, productMax]', () => {
        expect(clampPriceRange(-10, 99999, { productMax })).toEqual({
            min: 0,
            max: 5166,
        });
    });

    it('при min > max меняет значения местами', () => {
        expect(clampPriceRange(1200, 900, { productMax })).toEqual({
            min: 900,
            max: 1200,
        });
        expect(clampPriceRange(700, 200, {})).toEqual({
            min: 200,
            max: 700,
        });
    });

    it('равные min и max оставляем', () => {
        expect(clampPriceRange(500, 500, { productMax })).toEqual({
            min: 500,
            max: 500,
        });
    });

    it('одно поле не трогает другое', () => {
        expect(clampPriceRange(50, null, { productMax })).toEqual({
            min: 50,
            max: null,
        });
        expect(clampPriceRange(null, 0, { productMax })).toEqual({
            min: null,
            max: 0,
        });
    });
});

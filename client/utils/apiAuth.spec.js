import { describe, expect, it } from 'vitest';
import {
    isAuthRequiredApiPath,
    isProtectedAppRoute,
    pathnameFromApiRequest,
    shouldRedirectToSignInOn401,
} from './apiAuth';

describe('apiAuth', () => {
    it('isAuthRequiredApiPath', () => {
        expect(isAuthRequiredApiPath('/api/user/basket')).toBe(true);
        expect(isAuthRequiredApiPath('/api/admin/order')).toBe(true);
        expect(isAuthRequiredApiPath('/api/order')).toBe(true);
        expect(isAuthRequiredApiPath('/api/product-article')).toBe(false);
    });

    it('isProtectedAppRoute', () => {
        expect(isProtectedAppRoute('/admin')).toBe(true);
        expect(isProtectedAppRoute('/orders')).toBe(true);
        expect(isProtectedAppRoute('/catalog')).toBe(false);
    });

    it('shouldRedirectToSignInOn401 only on protected pages', () => {
        expect(shouldRedirectToSignInOn401('/api/user/basket', '/catalog')).toBe(false);
        expect(shouldRedirectToSignInOn401('/api/user/basket', '/orders')).toBe(true);
        expect(shouldRedirectToSignInOn401('/api/admin/order', '/admin')).toBe(true);
    });

    it('pathnameFromApiRequest', () => {
        expect(pathnameFromApiRequest('/api/user/basket', {})).toBe('/api/user/basket');
        expect(pathnameFromApiRequest('http://localhost:8000/api/order?page=0', {})).toBe(
            '/api/order',
        );
    });
});
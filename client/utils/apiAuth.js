/** Пути, с которых 401 обычно значит «нужна сессия» (не гостевой сценарий). */
export function isAuthRequiredApiPath(pathname) {
    if (!pathname.startsWith('/api/')) {
        return false;
    }
    if (pathname.startsWith('/api/user/') || pathname.startsWith('/api/admin/')) {
        return true;
    }
    if (pathname === '/api/order' || pathname.startsWith('/api/order/')) {
        return true;
    }
    return false;
}

/** Страницы с middleware auth/user — при 401 логично увести на вход. */
export function isProtectedAppRoute(path) {
    return path.startsWith('/admin') || path === '/orders';
}

/** Редирект только на защищённых страницах (ЛК/админка), не с публичной витрины. */
export function shouldRedirectToSignInOn401(_requestPath, routePath = '') {
    return isProtectedAppRoute(routePath);
}

export function pathnameFromApiRequest(request, options = {}) {
    const raw = options.path ?? (typeof request === 'string' ? request : String(request ?? ''));
    if (raw.startsWith('/api/')) {
        return raw.split('?')[0];
    }
    try {
        return new URL(raw, 'http://localhost').pathname;
    } catch {
        const noQuery = raw.split('?')[0];
        return noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
    }
}
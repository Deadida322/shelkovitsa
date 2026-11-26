import type { Plugin } from 'vite';

/**
 * Vuesax Alpha: unwrapElement проверяет $el через hasOwnProperty.
 * У Vue 3 component proxy $el часто не own-property → reference остаётся
 * компонентом → referenceElement.value.getBoundingClientRect падает (vs-select).
 */
export function fixVuesaxUnwrapElement(): Plugin {
    return {
        name: 'fix-vuesax-unwrap-element',
        enforce: 'pre',
        transform(code, id) {
            const normalized = id.replace(/\\/g, '/');
            if (!normalized.includes('vuesax-alpha') || !normalized.includes('unwrap-element')) {
                return;
            }
            if (!code.includes('hasOwnProperty.call(target, "$el")')) {
                return;
            }
            return code.replace(
                'Object.prototype.hasOwnProperty.call(target, "$el")',
                'typeof target === "object" && "$el" in target',
            );
        },
    };
}

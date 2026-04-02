/**
 * Dynamic import registry for book-specific mechanic configs.
 * Keys are book numbers; values are lazy import thunks.
 * Populated in Phase 4 when book data files are created.
 */
export const CONFIG_REGISTRY = {
    17: () => import('./book-17.js'),
    30: () => import('./book-30.js'),
};

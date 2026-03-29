/**
 * Base config shape -- used for all books without a specific config.
 *
 * Schema:
 * {
 *   bookNumber: number | null,
 *   extraStats: Array<{ id: string, label: string, initial: number, min: number, max: number | null }>,
 *   resources: Array<{ id: string, label: string, initial: number, min: number, max: number | null, step: number }>,
 *   combatVariant: 'standard',
 *   combatModifiers: {},
 * }
 */
export const config = {
    bookNumber: null,
    extraStats: [],
    resources: [],
    combatVariant: 'standard',
    combatModifiers: {},
};

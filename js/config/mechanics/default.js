/**
 * Base config shape -- used for all books without a specific config.
 *
 * Schema:
 * {
 *   bookNumber: number | null,
 *   extraStats: Array<{ id: string, label: string, initial: number, min: number, max: number | null }>,
 *   resources: Array<{ id: string, label: string, initial: number, min: number, max: number | null, step: number }>,
 *   checklists: Array<{ id: string, label: string, items: Array<{ id: string, label: string }> }>,
 *   combatVariant: 'standard',
 *   combatModifiers: {},
 *   // superpower: { options: string[] }  -- only present on books that require it (e.g. Book 17)
 * }
 */
export const config = {
    bookNumber: null,
    extraStats: [],
    resources: [],
    checklists: [],
    combatVariant: 'standard',
    combatModifiers: {},
};

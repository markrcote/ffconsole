/**
 * Book 30: Chasms of Malice (Luke Sharp)
 *
 * The player must navigate the underground chasms and defeat Malice. The adventure
 * features Kuddam (a demon the player must defeat multiple times), Tabasha the Bazouk
 * (an ally who can be restored in up to 4 steps), Provisions, Fuel for the gondola,
 * and a selection of Spells and Special Abilities.
 */
export const config = {
    bookNumber: 30,
    extraStats: [
        { id: 'kuddam_defeats', label: 'Kuddam Defeated', initial: 0, min: 0, max: null },
        { id: 'tabasha', label: 'Tabasha', initial: 0, min: 0, max: 4 },
    ],
    resources: [
        { id: 'provisions', label: 'Provisions', initial: 10, min: 0, max: null, step: 1 },
        { id: 'fuel', label: 'Fuel', initial: 10, min: 0, max: null, step: 1 },
    ],
    checklists: [
        {
            id: 'spells',
            label: 'Spells',
            items: [
                { id: 'spell-1', label: 'Spell 1' },
                { id: 'spell-2', label: 'Spell 2' },
                { id: 'spell-3', label: 'Spell 3' },
                { id: 'spell-4', label: 'Spell 4' },
                { id: 'spell-5', label: 'Spell 5' },
                { id: 'spell-6', label: 'Spell 6' },
            ],
        },
        {
            id: 'special_abilities',
            label: 'Special Abilities',
            items: [
                { id: 'ability-1', label: 'Ability 1' },
                { id: 'ability-2', label: 'Ability 2' },
                { id: 'ability-3', label: 'Ability 3' },
                { id: 'ability-4', label: 'Ability 4' },
            ],
        },
    ],
    combatVariant: 'standard',
    combatModifiers: {},
};

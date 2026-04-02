/**
 * Book 30: Chasms of Malice (Luke Sharp)
 *
 * The player must navigate the underground chasms and defeat Malice. The adventure
 * features Kuddam (a demon the player must defeat multiple times), Tabasha the Bazouk
 * (an ally who can be invoked once to restore a chosen stat), Provisions, Fuel for
 * the gondola, freeform Spells and Special Abilities, and a Cyphers notepad.
 */
export const config = {
    bookNumber: 30,
    extraStats: [],
    resources: [
        { id: 'provisions', label: 'Provisions', initial: 10, min: 0, max: null, step: 1 },
        { id: 'fuel', label: 'Fuel', initial: 10, min: 0, max: null, step: 1 },
    ],
    namedChecklists: [
        {
            id: 'kuddam',
            label: 'Kuddam',
            items: [
                { id: 'geshrak',   label: 'Geshrak' },
                { id: 'gurskut',   label: 'Gurskut' },
                { id: 'friankara', label: 'Friankara' },
                { id: 'barkek',    label: 'Barkek' },
                { id: 'griffkek',  label: 'Griffkek' },
                { id: 'churka',    label: 'Churka' },
                { id: 'kahhrac',   label: 'Kahhrac' },
            ],
        },
    ],
    tabasha: {
        pickerLabel: 'Choose Tabasha Attribute',
        pickerOptions: ['Skill', 'Luck'],
        encounterSlots: 8,
    },
    freeformLists: [
        { id: 'spells',            label: 'Spells' },
        { id: 'special_abilities', label: 'Special Abilities' },
    ],
    textareas: [
        { id: 'cyphers', label: 'Cyphers' },
    ],
    combatVariant: 'standard',
    combatModifiers: {},
};

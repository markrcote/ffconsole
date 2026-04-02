/**
 * Book 17: Appointment with F.E.A.R. (Steve Jackson)
 *
 * The Silver Crusader must collect 8 clues to discover the location of the
 * F.E.A.R. conference. Hero Points are earned for defeating villains and
 * performing heroic deeds. The player also chooses a superpower at the
 * start of the adventure.
 */
export const config = {
    bookNumber: 17,
    extraStats: [
        { id: 'hero_points', label: 'Hero Points', initial: 0, min: 0, max: null },
    ],
    resources: [],
    checklists: [
        {
            id: 'clues',
            label: 'Clues',
            items: [
                { id: 'clue-1', label: 'Clue 1' },
                { id: 'clue-2', label: 'Clue 2' },
                { id: 'clue-3', label: 'Clue 3' },
                { id: 'clue-4', label: 'Clue 4' },
                { id: 'clue-5', label: 'Clue 5' },
                { id: 'clue-6', label: 'Clue 6' },
                { id: 'clue-7', label: 'Clue 7' },
                { id: 'clue-8', label: 'Clue 8' },
            ],
        },
    ],
    superpower: {
        options: ['Psi-Powers', 'Energy Blast', 'Flying', 'Super Strength', 'Laser Vision'],
    },
    combatVariant: 'standard',
    combatModifiers: {},
};

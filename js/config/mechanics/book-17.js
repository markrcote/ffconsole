/**
 * Book 17: Appointment with F.E.A.R. (Steve Jackson)
 *
 * The Silver Crusader must collect clues to discover the location of the
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
    freeformLists: [
        { id: 'clues', label: 'Clues' },
    ],
    superpower: {
        options: ['Psi-Powers', 'Energy Blast', 'Flying', 'Super Strength', 'Laser Vision'],
    },
    combatVariant: 'standard',
    combatModifiers: {},
};

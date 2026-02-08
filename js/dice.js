/**
 * Dice rolling utilities for Fighting Fantasy
 */

/**
 * Roll a single die with the specified number of sides
 * @param {number} sides - Number of sides on the die (default: 6)
 * @returns {number} Random value from 1 to sides
 */
function roll(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice and sum the results
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides on each die (default: 6)
 * @returns {number} Sum of all dice rolls
 */
function rollMultiple(count, sides = 6) {
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += roll(sides);
    }
    return total;
}

/**
 * Generate initial stats for a new Fighting Fantasy adventure
 * @returns {Object} Object containing initial values for skill, stamina, and luck
 */
function rollInitialStats() {
    return {
        skill: roll(6) + 6,      // 1d6 + 6 (range 7-12)
        stamina: rollMultiple(2, 6) + 12,  // 2d6 + 12 (range 14-24)
        luck: roll(6) + 6        // 1d6 + 6 (range 7-12)
    };
}

export { roll, rollMultiple, rollInitialStats };

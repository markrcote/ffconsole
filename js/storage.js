/**
 * Local storage handling for Fighting Fantasy game state
 */

const STORAGE_KEY = 'ffconsole_gamestate';

/**
 * Save game state to localStorage
 * @param {Object} state - The game state to save
 */
function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

/**
 * Load game state from localStorage
 * @returns {Object|null} The saved game state, or null if none exists
 */
function load() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load game state:', e);
        return null;
    }
}

/**
 * Clear saved game state from localStorage
 */
function clear() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear game state:', e);
    }
}

export { save, load, clear };

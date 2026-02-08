/**
 * Storage handling for Fighting Fantasy game state
 * Uses server API with localStorage as fallback/cache
 */

const STORAGE_KEY = 'ffconsole_gamestate';

/**
 * Save game state to server and localStorage
 * @param {Object} state - The game state to save
 */
async function save(state) {
    // Always save to localStorage as cache
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }

    // Try to save to server
    try {
        const response = await fetch('/api/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('Failed to save to server:', e);
    }
}

/**
 * Load game state from server, falling back to localStorage
 * @returns {Promise<Object|null>} The saved game state, or null if none exists
 */
async function load() {
    // Try to load from server first
    try {
        const response = await fetch('/api/state');
        if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
                // Update localStorage cache
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return data;
            }
        }
    } catch (e) {
        console.error('Failed to load from server:', e);
    }

    // Fall back to localStorage
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return null;
    }
}

/**
 * Clear saved game state
 */
async function clear() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear localStorage:', e);
    }
}

export { save, load, clear };

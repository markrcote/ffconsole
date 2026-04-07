/**
 * Storage handling for Fighting Fantasy game state.
 * Uses /api/sessions with localStorage as fallback/cache.
 */

const STORAGE_KEY = 'ffconsole_gamestate';

/**
 * Save the current book's session to server and full state to localStorage.
 * Only PUTs the currentBook session (not all games) per D-06.
 * @param {Object} state - { games: { [bookNumber]: { skill, stamina, luck, mechanics } }, currentBook: number }
 */
async function save(state) {
    // Always save full state to localStorage as cache
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }

    if (!state.currentBook || !state.games) return;

    const game = state.games[state.currentBook];
    if (!game) return;

    try {
        const response = await fetch(`/api/sessions/${state.currentBook}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                book_number: state.currentBook,
                skill: game.skill,
                stamina: game.stamina,
                luck: game.luck,
                mechanics: game.mechanics ?? {},
                name: game.name ?? null,
            }),
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('Failed to save to server:', e);
    }
}

/**
 * Load game state. Fetches all sessions from server, derives currentBook
 * from most recently updated session. Falls back to localStorage.
 * @returns {Promise<Object|null>} { games, currentBook } or null
 */
async function load() {
    try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
            const sessions = await response.json();
            if (sessions.length > 0) {
                const games = {};
                sessions.forEach(s => {
                    games[s.book_number] = {
                        skill: s.skill,
                        stamina: s.stamina,
                        luck: s.luck,
                        mechanics: s.mechanics ?? {},
                        name: s.name ?? null,
                    };
                });
                // currentBook = most recently updated session
                const current = sessions.reduce((a, b) =>
                    a.updated_at > b.updated_at ? a : b
                );
                const data = { games, currentBook: current.book_number };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return data;
            }
            // Backend reachable but no sessions — authoritative empty state.
            // Do NOT fall through to localStorage (could be stale).
            return null;
        }
    } catch (e) {
        console.error('Failed to load from server:', e);
    }

    // localStorage fallback
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return null;
    }
}

/**
 * Clear saved game state from localStorage.
 */
async function clear() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear localStorage:', e);
    }
}

/**
 * Delete a specific book session from localStorage and the backend.
 * @param {number} bookNumber - The book number to delete
 */
async function deleteSession(bookNumber) {
    // Remove from localStorage
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.games) {
                delete parsed.games[bookNumber];
                parsed.currentBook = null;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
        }
    } catch (e) {
        console.error('deleteSession localStorage cleanup failed:', e);
    }

    // DELETE from backend
    try {
        const response = await fetch(`/api/sessions/${bookNumber}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('deleteSession failed:', e);
        // Continue — flow proceeds regardless (best-effort cleanup)
    }
}

export { save, load, clear, deleteSession };

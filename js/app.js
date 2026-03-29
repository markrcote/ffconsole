/**
 * Main application logic for Fighting Fantasy Adventure Sheet
 */

import { rollInitialStats } from './dice.js';
import { save, load } from './storage.js';
import { BOOKS, getBook, searchBooks } from './books.js';
import { testSkill, testStamina, testLuck, startCombat, rollCombatRound, endCombat } from './mechanics.js';
import { renderStats, renderStat, bindStatEvents } from './ui/stats.js';

// All games state (keyed by book number)
let games = {};

// Current book number
let currentBook = null;

// Current game state
let state = {
    skill: { initial: 0, current: 0 },
    stamina: { initial: 0, current: 0 },
    luck: { initial: 0, current: 0 }
};

// Modal state
let isSelectingForNewGame = false;

// Combat state (local, tracks the in-progress fight)
let combatState = {
    active: false,
    round: 0,
    enemy: { name: '', skill: 0, stamina: 0, staminaInitial: 0 },
};

/**
 * Initialize the application
 */
async function init() {
    const data = await load();
    if (data && data.games) {
        games = data.games;
        currentBook = data.currentBook;
        if (currentBook && games[currentBook]) {
            state = games[currentBook];
        }
    }

    render();
    bindEvents();

    // If no current book, show selection
    if (!currentBook) {
        showBookModal(false);
    }
}

/**
 * Show the book selection modal
 * @param {boolean} forNewGame - Whether selecting for a new game
 */
function showBookModal(forNewGame) {
    isSelectingForNewGame = forNewGame;
    const modal = document.getElementById('book-modal');
    const search = document.getElementById('book-search');
    const cancelBtn = document.getElementById('modal-cancel');

    modal.classList.add('active');
    search.value = '';
    renderBookList('');
    search.focus();

    // Hide cancel if no current book
    cancelBtn.style.display = currentBook ? 'block' : 'none';
}

/**
 * Hide the book selection modal
 */
function hideBookModal() {
    const modal = document.getElementById('book-modal');
    modal.classList.remove('active');
}

/**
 * Render the book list based on search query
 * @param {string} query - Search query
 */
function renderBookList(query) {
    const list = document.getElementById('book-list');
    const results = searchBooks(query);

    list.innerHTML = results.map(book => {
        const hasGame = games[book.number] !== undefined;
        return `
            <li class="book-item ${hasGame ? 'has-game' : ''}" data-number="${book.number}">
                <span class="book-number">${book.number}.</span>
                <span class="book-name">${book.title}</span>
                ${hasGame ? '<span class="book-status">In Progress</span>' : ''}
            </li>
        `;
    }).join('');
}

/**
 * Select a book
 * @param {number} bookNumber - The book number to select
 */
async function selectBook(bookNumber) {
    const book = getBook(bookNumber);
    if (!book) return;

    const hasExistingGame = games[bookNumber] !== undefined;

    if (isSelectingForNewGame) {
        // Starting a new game for this book
        if (hasExistingGame) {
            const confirmed = window.confirm(
                `You have a game in progress for "${book.title}".\n\n` +
                `Current stats: Skill ${games[bookNumber].skill.current}/${games[bookNumber].skill.initial}, ` +
                `Stamina ${games[bookNumber].stamina.current}/${games[bookNumber].stamina.initial}, ` +
                `Luck ${games[bookNumber].luck.current}/${games[bookNumber].luck.initial}\n\n` +
                `Start a new adventure? Your current progress will be lost.`
            );
            if (!confirmed) return;
        }

        // Create new game for this book
        const stats = rollInitialStats();
        state = {
            skill: { initial: stats.skill, current: stats.skill },
            stamina: { initial: stats.stamina, current: stats.stamina },
            luck: { initial: stats.luck, current: stats.luck },
            mechanics: {}
        };
        games[bookNumber] = state;
        currentBook = bookNumber;
        await save({ games, currentBook });
    } else {
        // Just switching to view/continue a book
        if (hasExistingGame) {
            state = games[bookNumber];
            currentBook = bookNumber;
            await save({ games, currentBook });
        } else {
            // No game exists, start a new one
            const stats = rollInitialStats();
            state = {
                skill: { initial: stats.skill, current: stats.skill },
                stamina: { initial: stats.stamina, current: stats.stamina },
                luck: { initial: stats.luck, current: stats.luck },
                mechanics: {}
            };
            games[bookNumber] = state;
            currentBook = bookNumber;
            await save({ games, currentBook });
        }
    }

    hideBookModal();
    render();
}

/**
 * Modify a stat by the given delta
 * @param {string} name - The stat name (skill, stamina, luck)
 * @param {number} delta - The change amount (+1 or -1)
 * @param {boolean} allowBonus - Whether to allow increasing above initial
 */
async function modifyStat(name, delta, allowBonus = false) {
    const stat = state[name];
    if (!stat) return;

    const newValue = stat.current + delta;

    if (newValue < 0) return;

    if (delta > 0 && stat.current >= stat.initial && !allowBonus) {
        return;
    }

    stat.current = newValue;
    games[currentBook] = state;
    await save({ games, currentBook });
    renderStat(name, state);
}

/**
 * Render all stats and book title to the DOM
 */
function render() {
    renderBookTitle();
    renderStats(state);
}

/**
 * Render the current book title
 */
function renderBookTitle() {
    const titleEl = document.getElementById('book-title');
    if (!titleEl) return;

    if (currentBook) {
        const book = getBook(currentBook);
        titleEl.textContent = book ? `#${book.number}: ${book.title}` : 'Fighting Fantasy';
    } else {
        titleEl.textContent = 'Select a Book';
    }
}

/**
 * Sync local state from a server SessionResponse and re-render.
 * Only current values are patched — initial values stay as-is.
 * @param {Object} session - SessionResponse from the backend
 */
function syncStateFromServer(session) {
    if (!session || !currentBook) return;
    state.skill.current = session.skill.current;
    state.stamina.current = session.stamina.current;
    state.luck.current = session.luck.current;
    games[currentBook] = state;
    render();
    save({ games, currentBook });
}

/**
 * Render the combat section based on combatState.
 */
function renderCombat() {
    const setup = document.getElementById('combat-setup');
    const active = document.getElementById('combat-active');
    const statusEl = document.getElementById('combat-status');
    const enemyStaminaEl = document.getElementById('combat-enemy-stamina');

    if (!setup || !active) return;

    if (combatState.active) {
        setup.hidden = true;
        active.hidden = false;
        if (statusEl) statusEl.textContent = `Round ${combatState.round}`;
        if (enemyStaminaEl) {
            const e = combatState.enemy;
            enemyStaminaEl.textContent = `${e.name || 'Enemy'}: ${e.stamina}/${e.staminaInitial} Stamina`;
        }
    } else {
        setup.hidden = false;
        active.hidden = true;
    }
}

/**
 * Bind event listeners
 */
function bindEvents() {
    // Stat adjustment buttons (delegated to ui/stats.js)
    bindStatEvents(state, { onModify: modifyStat });

    // New Adventure button
    const newGameBtn = document.getElementById('new-game');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => showBookModal(true));
    }

    // Switch Book button
    const switchBtn = document.getElementById('switch-book');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => showBookModal(false));
    }

    // Book title click
    const bookTitle = document.getElementById('book-title');
    if (bookTitle) {
        bookTitle.addEventListener('click', () => showBookModal(false));
    }

    // Book search
    const bookSearch = document.getElementById('book-search');
    if (bookSearch) {
        bookSearch.addEventListener('input', (e) => renderBookList(e.target.value));
    }

    // Book list clicks
    const bookList = document.getElementById('book-list');
    if (bookList) {
        bookList.addEventListener('click', (e) => {
            const item = e.target.closest('.book-item');
            if (item) {
                const num = parseInt(item.dataset.number, 10);
                selectBook(num);
            }
        });
    }

    // Modal cancel
    const cancelBtn = document.getElementById('modal-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideBookModal);
    }

    // Close modal on overlay click
    const modal = document.getElementById('book-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && currentBook) {
                hideBookModal();
            }
        });
    }

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentBook) {
            hideBookModal();
        }
    });

    // ── Tests ────────────────────────────────────────────────────────────────

    const testsResult = document.getElementById('tests-result');

    document.getElementById('test-skill')?.addEventListener('click', async () => {
        if (!currentBook) return;
        const r = await testSkill(currentBook, state.skill.current);
        if (testsResult) {
            testsResult.textContent =
                `Rolled ${r.roll} vs Skill ${r.target} — ${r.success ? 'Success!' : 'Failure!'}`;
        }
        if (r.session) syncStateFromServer(r.session);
    });

    document.getElementById('test-stamina')?.addEventListener('click', async () => {
        if (!currentBook) return;
        const r = await testStamina(currentBook, state.stamina.current);
        if (testsResult) {
            testsResult.textContent =
                `Rolled ${r.roll} vs Stamina ${r.target} — ${r.success ? 'Success!' : 'Failure!'}`;
        }
        if (r.session) syncStateFromServer(r.session);
    });

    document.getElementById('test-luck')?.addEventListener('click', async () => {
        if (!currentBook) return;
        const r = await testLuck(currentBook, state.luck.current);
        if (testsResult) {
            testsResult.textContent =
                `Rolled ${r.roll} vs Luck ${r.target} — ${r.success ? 'Lucky!' : 'Unlucky!'} (Luck now ${r.luckAfter})`;
        }
        if (r.session) {
            syncStateFromServer(r.session);
        } else {
            // Offline fallback: apply luck deduction locally
            state.luck.current = r.luckAfter;
            games[currentBook] = state;
            renderStat('luck', state);
            save({ games, currentBook });
        }
    });

    // ── Combat ───────────────────────────────────────────────────────────────

    document.getElementById('start-combat')?.addEventListener('click', async () => {
        if (!currentBook) return;
        const name = document.getElementById('enemy-name')?.value.trim() || 'Enemy';
        const skill = parseInt(document.getElementById('enemy-skill')?.value, 10) || 8;
        const stamina = parseInt(document.getElementById('enemy-stamina')?.value, 10) || 8;

        combatState = {
            active: true,
            round: 1,
            enemy: { name, skill, stamina, staminaInitial: stamina },
        };

        await startCombat(currentBook, name, skill, stamina);
        document.getElementById('combat-result').textContent = '';
        renderCombat();
    });

    document.getElementById('roll-round')?.addEventListener('click', async () => {
        if (!currentBook || !combatState.active) return;

        const r = await rollCombatRound(
            currentBook, state.skill.current, combatState.round, combatState.enemy
        );

        combatState.enemy.stamina = r.enemyStaminaAfter;

        const combatResult = document.getElementById('combat-result');
        const e = combatState.enemy;

        if (r.result === 'player_hit') {
            if (combatResult) combatResult.textContent =
                `Round ${combatState.round}: You hit! ${e.name} stamina ${e.stamina}/${e.staminaInitial}`;
        } else if (r.result === 'enemy_hit') {
            if (combatResult) combatResult.textContent =
                `Round ${combatState.round}: ${e.name} hits! Your stamina ${r.session ? r.session.stamina.current : state.stamina.current}/${state.stamina.initial}`;
        } else {
            if (combatResult) combatResult.textContent =
                `Round ${combatState.round}: Tied — no wounds.`;
        }

        if (r.session) syncStateFromServer(r.session);

        // Check for end of combat
        const playerStamina = r.session ? r.session.stamina.current : state.stamina.current;
        if (playerStamina <= 0 || e.stamina <= 0) {
            const winner = e.stamina <= 0 ? 'player' : 'enemy';
            await endCombat(currentBook, winner, playerStamina, e.stamina, combatState.round, e.name);
            if (combatResult) {
                combatResult.textContent = e.stamina <= 0
                    ? `${e.name} is slain! Combat over.`
                    : 'You have been defeated.';
            }
            combatState.active = false;
            renderCombat();
            return;
        }

        combatState.round++;
        renderCombat();
    });

    document.getElementById('flee-combat')?.addEventListener('click', async () => {
        if (!currentBook || !combatState.active) return;
        const e = combatState.enemy;
        await endCombat(currentBook, 'fled', state.stamina.current, e.stamina, combatState.round, e.name);
        document.getElementById('combat-result').textContent = 'You flee the battle.';
        combatState.active = false;
        renderCombat();
    });
}

document.addEventListener('DOMContentLoaded', init);

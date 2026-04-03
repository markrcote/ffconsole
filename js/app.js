/**
 * Main application logic for Fighting Fantasy Adventure Sheet
 */

import { rollInitialStats } from './dice.js';
import { save, load } from './storage.js';
import { BOOKS, getBook, searchBooks, getBookConfig } from './books.js';
import { testLuck, testCombatLuck, startCombat, rollCombatRound, endCombat } from './mechanics.js';
import { renderStats, renderStat, bindStatEvents } from './ui/stats.js';
import { showCharCreate } from './ui/charCreate.js';
import { renderDiceRoller } from './ui/diceRoller.js';
import { loadCombatHistory } from './ui/battle.js';
import { openBattleModal, closeBattleModal } from './ui/battleModal.js';
import { renderBookMechanics } from './ui/bookMechanics.js';
import { roll } from './dice.js';

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

    await render();
    bindEvents();

    // If no current book, show character creation
    if (!currentBook) {
        showCharCreate({
            games,
            currentBook,
            save,
            onComplete: async (bookNumber, stats, name, superpower) => {
                await _applyNewCharacter(bookNumber, stats, name, superpower);
            },
        });
    }

    // Initialise dice roller widget (D-12)
    const diceSection = document.getElementById('dice-section');
    if (diceSection) renderDiceRoller(diceSection);

    // Wire Start Battle button to open combat modal
    const startBattleBtn = document.getElementById('start-battle-btn');
    if (startBattleBtn) {
        startBattleBtn.addEventListener('click', () => {
            openBattleModal(
                () => ({ state, combatState, currentBook }),
                {
                    onStart: startCombat,
                    onRollRound: rollCombatRound,
                    onFlee: endCombat,
                    onEnd: endCombat,
                    onStatSync: syncStateFromServer,
                    onCombatEnd: () => { combatState.active = false; },
                    onTestLuck: (bookNumber, luckCurrent, round, context, damageBefore) =>
                        testCombatLuck(bookNumber, luckCurrent, round, context, damageBefore),
                    onCombatStateChange: (active) => { combatState.active = active; },
                }
            );
        });
    }

    // Load combat history for current session
    const historyContainer = document.getElementById('combat-history');
    if (currentBook && historyContainer) {
        loadCombatHistory(currentBook, historyContainer);
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
    await render();
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
async function render() {
    renderBookTitle();
    renderCharName();
    renderStats(state);
    await renderBookMechanicsSection();
}

/**
 * Render book-specific mechanics section based on the current book config.
 * Shows or hides #book-mechanics-section depending on whether the book has mechanic content.
 */
async function renderBookMechanicsSection() {
    const container = document.getElementById('book-mechanics-section');
    if (!container) return;

    if (!currentBook) {
        container.hidden = true;
        return;
    }

    const bookConfig = await getBookConfig(currentBook);

    // Check if config has any mechanics content
    const hasContent = (bookConfig.extraStats?.length > 0)
        || (bookConfig.resources?.length > 0)
        || (bookConfig.checklists?.length > 0)
        || (bookConfig.namedChecklists?.length > 0)
        || (bookConfig.freeformLists?.length > 0)
        || (bookConfig.tabasha != null)
        || (bookConfig.textareas?.length > 0)
        || (bookConfig.superpower && state.mechanics?.superpower);

    if (!hasContent) {
        container.hidden = true;
        return;
    }

    const mechanicsState = state.mechanics || {};

    renderBookMechanics(container, bookConfig, mechanicsState, (updatedMechanics) => {
        state.mechanics = updatedMechanics;
        games[currentBook] = state;
        save({ games, currentBook });
    }, (attribute) => {
        // Tabasha restore: reset the chosen stat (skill or luck) to its initial value
        const stat = attribute && attribute.toLowerCase();
        if (stat && state[stat]) {
            state[stat].current = state[stat].initial;
            games[currentBook] = state;
            save({ games, currentBook });
            renderStat(stat, state);
        }
    });
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
 * Render the character name below the book title.
 * Hidden entirely when no name (D-13, D-14).
 */
function renderCharName() {
    const nameEl = document.getElementById('char-name');
    if (!nameEl) return;
    const name = state && state.name;
    if (name) {
        nameEl.textContent = name;
        nameEl.classList.add('visible');
    } else {
        nameEl.textContent = '';
        nameEl.classList.remove('visible');
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
 * Apply a newly created character from the char creation flow.
 * Called from both the "New Adventure" handler and the init() first-load path.
 * Saves to backend via storage.js save().
 * @param {number} bookNumber
 * @param {Object} stats - { skill, stamina, luck } each { initial, current }
 * @param {string|null} name - Character name or null
 * @param {string|null} pickerChoice - Selected picker value (superpower or tabasha attribute), or null
 */
async function _applyNewCharacter(bookNumber, stats, name, pickerChoice) {
    const bookConfig = await getBookConfig(bookNumber);
    let mechanics = {};

    if (bookConfig.superpower && pickerChoice) {
        mechanics.superpower = pickerChoice;
    }

    if (bookConfig.tabasha && pickerChoice) {
        mechanics.tabasha = {
            attribute: pickerChoice.toLowerCase(),
            restoreUsed: false,
            encounters: Array(bookConfig.tabasha.encounterSlots).fill(''),
        };
    }

    state = {
        skill:    { initial: stats.skill.initial,   current: stats.skill.current },
        stamina:  { initial: stats.stamina.initial, current: stats.stamina.current },
        luck:     { initial: stats.luck.initial,    current: stats.luck.current },
        mechanics,
        name: name || null,
    };
    games[bookNumber] = state;
    currentBook = bookNumber;
    await save({ games, currentBook });
    await render();
}

/**
 * Bind event listeners
 */
function bindEvents() {
    // Stat adjustment buttons (delegated to ui/stats.js)
    bindStatEvents(() => state, { onModify: modifyStat });

    // New Adventure button
    const newGameBtn = document.getElementById('new-game');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            showCharCreate({
                games,
                currentBook,
                save,
                onComplete: async (bookNumber, stats, name, superpower) => {
                    await _applyNewCharacter(bookNumber, stats, name, superpower);
                },
            });
        });
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

    document.getElementById('test-luck')?.addEventListener('click', async () => {
        if (!currentBook) return;

        const luckBtn = document.getElementById('test-luck');
        if (luckBtn) luckBtn.disabled = true;

        // Roll two cosmetic dice locally for display (D-08, Research Risk 1 mitigation)
        // testLuck() also rolls internally — both are random, game correctness unaffected.
        const d1 = roll(6);
        const d2 = roll(6);

        const r = await testLuck(currentBook, state.luck.current);

        const luckResultEl = document.getElementById('luck-result');
        if (luckResultEl) {
            const isLucky = r.success;
            luckResultEl.innerHTML = `
                <div class="luck-result__dice">
                    <span class="die-face">${d1}</span>
                    <span class="luck-result__plus">+</span>
                    <span class="die-face">${d2}</span>
                    <span class="luck-result__total">= ${d1 + d2}</span>
                </div>
                <p class="luck-result__label ${isLucky ? 'luck-result__label--lucky' : 'luck-result__label--unlucky'}">
                    ${isLucky ? 'Lucky!' : 'Unlucky.'}
                </p>
                <p class="luck-result__footnote">Luck is now ${r.luckAfter}</p>
            `;
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

        // Re-enable button after 800ms (prevents accidental re-tap per UI-SPEC)
        setTimeout(() => {
            if (luckBtn) luckBtn.disabled = false;
        }, 800);
    });

}

document.addEventListener('DOMContentLoaded', init);
